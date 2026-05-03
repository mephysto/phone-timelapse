const express = require('express');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  process.stderr.write('Warning: no LAN IPv4 address found, falling back to 127.0.0.1\n');
  return '127.0.0.1';
}

const LOCAL_IP = getLocalIp();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('cert.pem') || !fs.existsSync('key.pem')) {
  console.error(`✗ HTTPS certificates not found.
Run the following commands to set up mkcert:
  1. Install mkcert: https://github.com/FiloSottile/mkcert#installation
  2. mkcert -install
  3. mkcert -key-file key.pem -cert-file cert.pem 192.168.20.28 localhost 127.0.0.1
  4. On your iPhone: Settings → General → VPN & Device Management → trust the mkcert CA
Then restart the server.`);
  process.exit(1);
}

const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');

// ── Session state ─────────────────────────────────────────────────────────────

const session = {
  status:         'idle',
  startTime:      null,
  scheduledStart: null,
  scheduledEnd:   null,
  interval:       30,
  format:         'jpg',
  outputDir:      '',
  frameCount:     0,
  expectedFrames: 0,
  totalBytes:     0,
  gaps:           [],
  lastCaptureAt:  null,
};

let phoneSocket          = null;
let captureTimer         = null;
let latestFramePath      = null;
let gapStart             = null;
let _scheduledStartFired = false;
let _scheduledEndFired   = false;

// ── Time helpers ──────────────────────────────────────────────────────────────

function pad2(n) { return String(n).padStart(2, '0'); }

function formatTimePart(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function formatDatePart(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function getLocalHHMM() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

// Returns the next Date at which HH:MM occurs — today if still future, tomorrow if past.
function nextOccurrence(hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hh, mm, 0, 0);
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

// ── Session log ───────────────────────────────────────────────────────────────

function buildLogContent(endTime) {
  const totalSecs = Math.floor((endTime - session.startTime) / 1_000);
  let log = 'Phone Timelapse — Session Log\n';
  log += '==============================\n';
  log += `Date:     ${formatDatePart(session.startTime)}\n`;
  log += `Start:    ${formatTimePart(session.startTime)}\n`;
  log += `End:      ${formatTimePart(endTime)}\n`;
  log += `Duration: ${formatDuration(totalSecs)}\n`;
  log += '\n';
  log += `Frames captured:  ${session.frameCount}\n`;
  log += `Frames expected:  ${session.expectedFrames}\n`;
  log += `Gaps:             ${session.gaps.length}\n`;
  for (let i = 0; i < session.gaps.length; i++) {
    const gap    = session.gaps[i];
    const from   = new Date(gap.from);
    const to     = new Date(gap.to);
    const frames = gap.missed === 1 ? '1 frame' : `${gap.missed} frames`;
    log += `\nGap #${i + 1}\n`;
    log += `  From:   ${formatTimePart(from)}\n`;
    log += `  To:     ${formatTimePart(to)}\n`;
    log += `  Missed: ${frames}\n`;
  }
  return log;
}

async function writeSessionLog(endTime) {
  if (!session.outputDir) return;
  const logPath = path.join(session.outputDir, 'session.log');
  try {
    await fs.promises.writeFile(logPath, buildLogContent(endTime), 'utf8');
  } catch (err) {
    console.error('Failed to write session log:', err.message);
  }
}

// ── Gap management ────────────────────────────────────────────────────────────

function closeOpenGap(gapEnd) {
  if (gapStart === null) return null;
  const durationSecs = (gapEnd - gapStart) / 1_000;
  const missed = Math.floor(durationSecs / session.interval);
  const entry = { from: gapStart.toISOString(), to: gapEnd.toISOString(), missed };
  session.gaps.push(entry);
  gapStart = null;
  return entry;
}

// ── Output folder ─────────────────────────────────────────────────────────────

function resolveOutputDir() {
  const dateStr = formatDatePart(new Date());
  const root    = path.resolve(process.cwd(), 'output');
  fs.mkdirSync(root, { recursive: true });

  let candidate = path.join(root, dateStr);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    suffix++;
    candidate = path.join(root, `${dateStr} (${suffix})`);
  }

  fs.mkdirSync(candidate);
  return candidate;
}

// ── Capture scheduler ─────────────────────────────────────────────────────────

function startCaptureScheduler() {
  if (captureTimer !== null) return;
  captureTimer = setInterval(() => {
    session.expectedFrames++;
    if (phoneSocket) {
      phoneSocket.emit('capture', { format: session.format });
    }
  }, session.interval * 1_000);
}

function stopCaptureScheduler() {
  clearInterval(captureTimer);
  captureTimer = null;
}

// ── Session management ────────────────────────────────────────────────────────

function startSession(options = {}) {
  if (session.status === 'running') {
    return { ok: false, reason: 'Session already running' };
  }
  if (options.interval       !== undefined) session.interval       = Number(options.interval);
  if (options.format         !== undefined) session.format         = options.format;
  if (options.scheduledStart !== undefined) session.scheduledStart = options.scheduledStart;
  if (options.scheduledEnd   !== undefined) session.scheduledEnd   = options.scheduledEnd;

  session.status         = 'running';
  session.startTime      = new Date();
  session.frameCount     = 0;
  session.expectedFrames = 0;
  session.totalBytes     = 0;
  session.gaps           = [];
  session.lastCaptureAt  = null;
  session.outputDir      = resolveOutputDir();
  _scheduledStartFired   = true;
  startCaptureScheduler();
  return { ok: true };
}

async function stopSession() {
  if (session.status !== 'running') {
    return { ok: false, reason: 'No session is running' };
  }
  const endTime = new Date();

  const closedGap = closeOpenGap(endTime);
  if (closedGap) {
    io.to('dashboard').emit('gap-ended', closedGap);
  }

  stopCaptureScheduler();
  session.status = 'stopped';

  await writeSessionLog(endTime);

  return {
    ok: true,
    summary: {
      duration:       Math.floor((endTime - session.startTime) / 1_000),
      frameCount:     session.frameCount,
      expectedFrames: session.expectedFrames,
      gapCount:       session.gaps.length,
    },
  };
}

function getSession() {
  return { ...session };
}

// ── Scheduled start / stop ────────────────────────────────────────────────────

function checkScheduledStart() {
  if (!session.scheduledStart) return;
  if (session.status !== 'idle') return;
  const current = getLocalHHMM();
  if (current === session.scheduledStart) {
    if (_scheduledStartFired) return;
    _scheduledStartFired = true;
    startSession();
    io.emit('session-started', getSession());
  } else {
    _scheduledStartFired = false;
  }
}

function checkScheduledEnd() {
  if (!session.scheduledEnd) return;
  if (session.status !== 'running') return;
  const current = getLocalHHMM();
  if (current === session.scheduledEnd) {
    if (_scheduledEndFired) return;
    _scheduledEndFired = true;
    stopSession().then(result => {
      if (result.ok) {
        io.emit('session-ended', { ...getSession(), summary: result.summary });
      }
    });
  } else {
    _scheduledEndFired = false;
  }
}

setInterval(() => {
  checkScheduledStart();
  checkScheduledEnd();
}, 1_000);

// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const server = https.createServer({ key, cert }, app);
const io = new Server(server, { maxHttpBufferSize: 10e6 });

app.use(express.static('public'));

app.get('/qr', async (req, res) => {
  const phoneUrl = `https://${LOCAL_IP}:${PORT}/phone`;
  try {
    const buffer = await QRCode.toBuffer(phoneUrl);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).type('text/plain').send(`QR generation failed: ${err.message}`);
  }
});

app.get('/latest-frame', (req, res) => {
  if (latestFramePath === null) {
    return res.status(404).type('text/plain').send('No frames saved yet');
  }
  const ext  = path.extname(latestFramePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  res.setHeader('Content-Type', mime);
  res.sendFile(latestFramePath, (err) => {
    if (!err) return;
    if (err.code === 'ENOENT') {
      res.status(404).type('text/plain').send('Frame file not found');
    } else {
      res.status(500).type('text/plain').send(err.message);
    }
  });
});

// ── Phone socket handlers ─────────────────────────────────────────────────────

function attachPhoneHandlers(socket) {
  socket.on('frame', async (data) => {
    if (session.status !== 'running') return;

    const frameNum = session.frameCount + 1;
    const timestamp = new Date().toISOString();
    const paddedNum = String(frameNum).padStart(4, '0');
    const filePath  = path.join(session.outputDir, `frame_${paddedNum}.${session.format}`);

    try {
      await fs.promises.writeFile(filePath, data);
      const fileSize        = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
      session.frameCount    = frameNum;
      session.totalBytes   += fileSize;
      session.lastCaptureAt = new Date(timestamp);
      latestFramePath       = filePath;

      socket.emit('frame-ack', { frameNum, timestamp });
      io.to('dashboard').emit('frame-saved', {
        frameNum,
        timestamp,
        path: filePath,
        fileSize,
        totalBytes: session.totalBytes,
      });
    } catch (err) {
      console.error('Failed to write frame:', err.message);
    }
  });

  socket.on('stop-session', async () => {
    const result = await stopSession();
    if (result.ok) {
      io.to('dashboard').emit('session-ended', { ...getSession(), summary: result.summary });
    }
  });
}

// ── Socket.IO connections ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const referer = socket.handshake.headers.referer || '';
  if (referer.endsWith('/phone')) {
    // Close any open gap when phone reconnects
    if (gapStart !== null) {
      const closedGap = closeOpenGap(new Date());
      if (closedGap) {
        io.to('dashboard').emit('gap-ended', closedGap);
      }
    }

    phoneSocket = socket;
    console.log('Phone socket registered:', socket.id);
    attachPhoneHandlers(socket);

    socket.on('disconnect', () => {
      console.log('Phone disconnected:', socket.id);
      phoneSocket = null;
      if (session.status === 'running') {
        gapStart = new Date();
        io.to('dashboard').emit('gap-started', { at: gapStart.toISOString() });
      }
    });

  } else {
    socket.join('dashboard');
    socket.emit('status-update', getSession());

    socket.on('start-session', (options = {}) => {
      const result = startSession(options);
      if (result.ok) {
        io.emit('session-started', getSession());
      } else {
        socket.emit('session-error', result);
      }
    });

    socket.on('stop-session', async () => {
      const result = await stopSession();
      if (result.ok) {
        io.emit('session-ended', { ...getSession(), summary: result.summary });
      } else {
        socket.emit('session-error', result);
      }
    });

    socket.on('update-settings', (settings) => {
      if (session.status === 'running') {
        socket.emit('session-error', { ok: false, reason: 'Cannot change settings while session is running' });
        return;
      }
      if (settings.interval       !== undefined) session.interval       = Number(settings.interval);
      if (settings.format         !== undefined) session.format         = settings.format;
      if (settings.scheduledStart !== undefined) session.scheduledStart = settings.scheduledStart;
      if (settings.scheduledEnd   !== undefined) session.scheduledEnd   = settings.scheduledEnd;
      io.to('dashboard').emit('status-update', getSession());
    });

    socket.on('set-schedule', ({ scheduledStart, scheduledEnd } = {}) => {
      if (scheduledStart !== undefined) {
        session.scheduledStart = scheduledStart || null;
        _scheduledStartFired   = false;
      }
      if (scheduledEnd !== undefined) {
        session.scheduledEnd = scheduledEnd || null;
        _scheduledEndFired   = false;
      }
      io.to('dashboard').emit('status-update', getSession());
    });

    socket.on('disconnect', () => {
      console.log('Dashboard disconnected:', socket.id);
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Dashboard: https://${LOCAL_IP}:${PORT}`);
  console.log(`Phone:     https://${LOCAL_IP}:${PORT}/phone`);
});
