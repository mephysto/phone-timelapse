const express = require('express');
const https = require('https');
const fs = require('fs');
const os = require('os');
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
  status:         'idle',   // 'idle' | 'running' | 'stopped'
  startTime:      null,     // Date | null
  scheduledStart: null,     // "HH:MM" string | null
  scheduledEnd:   null,     // "HH:MM" string | null
  interval:       30,       // seconds
  format:         'jpg',    // 'png' | 'jpg'
  outputDir:      '',       // absolute path, set at session start by T-14
  frameCount:     0,
  expectedFrames: 0,
  gaps:           [],       // [{ from: Date, to: Date, missed: number }]
  lastCaptureAt:  null,     // Date | null
};

let phoneSocket  = null;
let captureTimer = null;

function startCaptureScheduler() {
  if (captureTimer !== null) return;
  const intervalMs = session.interval * 1_000;
  captureTimer = setInterval(() => {
    session.expectedFrames++;
    if (phoneSocket) {
      phoneSocket.emit('capture', { format: session.format });
    }
  }, intervalMs);
}

function stopCaptureScheduler() {
  clearInterval(captureTimer);
  captureTimer = null;
}

function startSession(options = {}) {
  if (session.status === 'running') {
    return { ok: false, reason: 'Session already running' };
  }
  if (options.interval  !== undefined) session.interval        = options.interval;
  if (options.format    !== undefined) session.format          = options.format;
  if (options.scheduledStart !== undefined) session.scheduledStart = options.scheduledStart;
  if (options.scheduledEnd   !== undefined) session.scheduledEnd   = options.scheduledEnd;

  session.status        = 'running';
  session.startTime     = new Date();
  session.frameCount    = 0;
  session.expectedFrames = 0;
  session.gaps          = [];
  session.lastCaptureAt = null;
  session.outputDir     = '';
  startCaptureScheduler();
  return { ok: true };
}

function stopSession() {
  if (session.status === 'idle') {
    return { ok: false, reason: 'No session is running' };
  }
  stopCaptureScheduler();
  session.status = 'stopped';
  return { ok: true };
}

function getSession() {
  return { ...session };
}

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

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const referer = socket.handshake.headers.referer || '';
  if (referer.endsWith('/phone')) {
    phoneSocket = socket;
    console.log('Phone socket registered:', socket.id);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket === phoneSocket) {
      phoneSocket = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Dashboard: https://${LOCAL_IP}:${PORT}`);
  console.log(`Phone:     https://${LOCAL_IP}:${PORT}/phone`);
});
