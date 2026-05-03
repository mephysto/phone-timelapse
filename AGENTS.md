# AGENTS.md — Phone Timelapse

This file is the first thing any agent should read when starting a session on this project.

---

## What This Project Is

A local-network timelapse system. An iPhone running Safari acts as the camera. A Node.js server on this PC (WSL) sends timed capture commands over WebSocket, receives frame images from the phone, and saves them to disk. A browser dashboard on the PC controls the session and shows live status.

**No cloud services. No build step. Phone and PC must be on the same WiFi network.**

Tech stack: Node.js · Express · Socket.IO · vanilla JS (no frontend framework or build tool)

---

## How to Orient Yourself at the Start of a Session

Follow these steps every time you start a new session, in order:

1. **Read this file** (done).
2. **Read `docs/requirements.md`** — the full functional and non-functional requirements for the project.
3. **Read `docs/design.md`** — architecture, data flow, Socket.IO event table, file structure, and design decisions.
4. **Read `docs/tasks.md`** — the master task list (T-01 through T-30). Find which tasks are complete, in progress, or not started.
5. **Check `docs/specs/`** — look for a spec folder for the current task (e.g. `docs/specs/001-project-setup/`). If one exists, read its `tasks.md` to find exactly where work left off.
6. **Check git status** — `git log --oneline -10` and `git status` to see what has already been committed.

After these steps you should have full context. Do not start writing code until you have completed this orientation.

---

## Documentation Structure

```
docs/
├── requirements.md        # Project-level requirements (source of truth)
├── design.md              # Architecture, data flow, API contracts, file layout
├── tasks.md               # Master task list — T-01 through T-30 across 6 phases
└── specs/
    ├── 001-project-setup/ # One folder per task (created when the task is picked up)
    │   ├── requirements.md
    │   ├── design.md
    │   ├── tasks.md
    │   └── review.md      # Written by Spec Guardian after Worker completes
    ├── 002-express-socketio-server/
    │   └── ...
    └── NNN-task-slug/
        └── ...
```

The **project-level docs** (`docs/requirements.md`, `docs/design.md`, `docs/tasks.md`) describe the whole system. They are the authority on what the project does and how it should be built.

The **spec folders** (`docs/specs/NNN-task-slug/`) describe a single task in detail. They are written before implementation begins and are the day-to-day working document for an agent executing that task.

---

## Task Numbering

Spec folder numbers correspond to the task numbers in `docs/tasks.md`:

| Task | Spec folder |
|------|-------------|
| T-01 | `docs/specs/001-project-setup/` |
| T-02 | `docs/specs/002-express-socketio-server/` |
| T-03 | `docs/specs/003-local-ip-detection/` |
| ... | ... |

Use the same number, zero-padded to 3 digits, followed by a short kebab-case slug matching the task title.

---

## Spec Folder Contents

Each spec folder contains exactly three files:

### `requirements.md`
- **User story** in Given / When / Then format
- **Acceptance criteria** — specific, testable conditions that define "done"
- **Gotchas and edge cases** the implementation must handle

These are written at a level of detail that unit tests can be derived directly from them.

### `design.md`
- **Views / UI states** — every state the UI can be in, described precisely
- **Visual assets** — any images, icons, or media involved (even if minimal)
- **State to manage** — what data the component or module tracks and how it changes
- **Interfaces** — function signatures, Socket.IO events, HTTP endpoints relevant to this task

### `tasks.md`
- A flat checkbox list of atomic implementation steps
- Format: `- [ ] task description` (unchecked) or `- [x] task description` (done)
- Tasks must be small enough that each one can be verified independently
- **This file is the live progress tracker for the task**

### `review.md`
- Written **only by the Spec Guardian** after the Worker completes the task
- Never written or modified by the Worker or Orchestrator
- Contains: AC results table, overall verdict, issues found, and a recommendation
- Survives context resets — the Orchestrator reads this file, not the Guardian's return message
- Pre-populated with a PENDING template; Guardian fills it in

---

## Agent Architecture

This project uses a three-agent loop. Agents 2 and 3 are spawned and terminated by the Orchestrator for each task.

### The Three Agents

**1 — Orchestrator**
- Stays alive across the full project session
- Reads `AGENTS.md`, `docs/tasks.md`, and `review.md` files to track overall state
- Spawns Workers and Spec Guardians in sequence (or in parallel for the dashboard phase)
- Never writes code itself — only reads specs, delegates, and makes routing decisions
- If its context grows too large, it can be restarted: `AGENTS.md` + `docs/tasks.md` + all `review.md` files contain enough state to fully resume

**2 — Worker**
- Spawned by the Orchestrator for one task at a time
- Receives: the spec folder (`requirements.md`, `design.md`, `tasks.md`), relevant existing code files, and any prior `review.md` if this is a fix run
- Implements the task, updating `tasks.md` checkboxes as it goes (`[ ]` → `[~]` → `[x]`)
- Terminated when the task is complete; its output is the changed code files

**3 — Spec Guardian**
- Spawned by the Orchestrator after each Worker completes
- Receives: the spec folder and the code files changed by the Worker
- Reads every acceptance criterion in `requirements.md` and checks each one against the code
- Writes its findings into `review.md` — this is the only file it touches
- Terminated after writing the review; the Orchestrator reads `review.md` and decides next step

### The Loop

```
Orchestrator reads docs/tasks.md → finds next incomplete task

  ┌─ spawn Worker ──────────────────────────────────────┐
  │  Worker reads spec folder                           │
  │  Worker implements task, updates tasks.md           │
  │  Worker terminated                                  │
  └─────────────────────────────────────────────────────┘
              ↓
  ┌─ spawn Spec Guardian ───────────────────────────────┐
  │  Guardian reads requirements.md + changed code      │
  │  Guardian writes review.md                          │
  │  Guardian terminated                                │
  └─────────────────────────────────────────────────────┘
              ↓
  Orchestrator reads review.md

  if FAIL  → spawn new Worker with spec + review.md context → repeat
  if PASS  → mark task complete in docs/tasks.md → next task
  if PARTIAL (MANUAL ACs only) → mark complete, defer to T-30
```

### Parallel Window — Dashboard Phase (T-18 to T-24)

Once T-17 (Dashboard Shell) is complete, panels T-18 through T-24 touch independent sections of `dashboard.html`. The Orchestrator may spawn up to 3 Workers in parallel:

- Worker A → T-18 (QR panel) + T-19 (session controls)
- Worker B → T-20 (live stats) + T-21 (live preview)
- Worker C → T-22 (settings) + T-23 (gap log) + T-24 (session summary)

After all three Workers complete, spawn 3 Spec Guardians in parallel, then integrate.

### The `review.md` Format

```markdown
# Review — T-NN · Task Title
Status: PASS | FAIL | PARTIAL

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | [AC text] | ✅ PASS | |
| 2 | [AC text] | ❌ FAIL | [Specific reason + file:line] |
| 3 | [AC text] | ⚠️ MANUAL | Requires physical device — deferred to T-30 |

## Verdict
PASS | FAIL | PARTIAL

## Issues Found
[If any ACs failed: exactly what is wrong and where in the code.]

## Recommendation
SHIP | FIX: [specific instruction for next Worker] | MANUAL-TEST-NEEDED
```

### Physical Hardware Limitation

The Spec Guardian cannot verify ACs that require a real device. Any AC involving:
- Physical camera access or QR scanning
- Screen wake-lock behaviour over time
- WiFi connectivity between phone and PC
- Safari-specific rendering

...must be marked `⚠️ MANUAL` and deferred to T-30 (end-to-end test). This is not a failure — it is the correct third state.

---

## The Orchestrator Workflow

The `tasks.md` inside each spec folder is the single source of truth for task progress. Agents must keep it updated continuously:

1. **Before starting a sub-task:** change `[ ]` to `[~]` (in progress): `- [~] task description`
2. **After completing a sub-task:** change `[~]` to `[x]`: `- [x] task description`
3. **If a sub-task is blocked or skipped:** note it inline: `- [ ] task description ← BLOCKED: reason`

This means an agent can be interrupted at any point, context can be cleared, and the next agent that reads the spec folder will know exactly what is done, what is in progress, and what remains.

**Do not rely on conversation history or memory to track progress. The spec `tasks.md` is the only reliable record.**

---

## Workflow for Starting a New Task

When the user asks you to begin a task that does not yet have a spec folder:

1. Identify the task number from `docs/tasks.md` (e.g. T-02).
2. Create the spec folder: `docs/specs/002-express-socketio-server/`.
3. Write all four spec files (`requirements.md`, `design.md`, `tasks.md`, `review.md`) before touching any code. The `review.md` is pre-populated with the PENDING template.
4. Show the specs to the user and get confirmation before proceeding.
5. Spawn a Worker with the spec folder as context.
6. After the Worker completes, spawn a Spec Guardian.
7. Orchestrator reads `review.md`; if FAIL, spawn a new Worker with the review as additional context.
8. When PASS or PARTIAL, mark the task complete in `docs/tasks.md`.

---

## Workflow for Continuing a Task In Progress

If a spec folder already exists for the current task:

1. Read `docs/specs/NNN-task-slug/tasks.md`.
2. Find the first item that is `[ ]` or `[~]`.
3. Continue from there.
4. Do not re-do work that is already `[x]`.

---

## Key Constraints (Do Not Forget)

- **No build step** — frontend is vanilla JS. Do not introduce Vite, Webpack, or any bundler.
- **Single entrypoint** — `node server.js` starts everything. No separate processes.
- **Local network only** — the server binds to the local IP, not just `localhost`. No external services.
- **iOS Safari** — the phone page must work in Safari on iOS. Test assumptions against Safari compatibility.
- **getUserMedia on iOS caps at ~1080p** — this is a platform limit. Do not try to work around it.
- **WSL** — the server runs on WSL (Linux on Windows). File paths use Linux conventions.

---

## Master Task List (Quick Reference)

See `docs/tasks.md` for full descriptions. Status column updated as tasks are completed.

| # | Task | Phase | Status |
|---|------|-------|--------|
| T-01 | Project setup | 1 — Server Foundation | [ ] |
| T-02 | Basic Express + Socket.IO server | 1 | [ ] |
| T-03 | Local IP detection | 1 | [ ] |
| T-04 | QR code endpoint | 1 | [ ] |
| T-05 | Phone page shell | 2 — Phone Page | [ ] |
| T-06 | Camera access | 2 | [ ] |
| T-07 | NoSleep wake-lock | 2 | [ ] |
| T-08 | Frame capture and send | 2 | [ ] |
| T-09 | Phone status UI | 2 | [ ] |
| T-10 | WebSocket reconnection | 2 | [ ] |
| T-11 | Session state management | 3 — Session Engine | [ ] |
| T-12 | Capture scheduler | 3 | [ ] |
| T-13 | Frame receiver and disk writer | 3 | [ ] |
| T-14 | Output folder naming | 3 | [ ] |
| T-15 | Gap detection and logging | 3 | [ ] |
| T-16 | Session log writer | 3 | [ ] |
| T-17 | Dashboard shell | 4 — PC Dashboard | [ ] |
| T-18 | Dashboard — QR code panel | 4 | [ ] |
| T-19 | Dashboard — session controls | 4 | [ ] |
| T-20 | Dashboard — live stats | 4 | [ ] |
| T-21 | Dashboard — live preview thumbnail | 4 | [ ] |
| T-22 | Dashboard — settings panel | 4 | [ ] |
| T-23 | Dashboard — gap log panel | 4 | [ ] |
| T-24 | Dashboard — session summary | 4 | [ ] |
| T-25 | Auto-start at scheduled time | 5 — Scheduled Sessions | [ ] |
| T-26 | Auto-stop at scheduled end time | 5 | [ ] |
| T-27 | `/latest-frame` endpoint | 6 — Polish & Docs | [ ] |
| T-28 | Actual disk usage counter | 6 | [ ] |
| T-29 | README | 6 | [ ] |
| T-30 | End-to-end test | 6 | [ ] |
