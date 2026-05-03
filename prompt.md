# Spec-Driven Development — Project Setup Prompt

You are starting a new software project from an empty folder. Your job is to set up the project using Spec-Driven Development (SDD), then conduct a thorough requirements interview with the user, and produce a complete set of specification documents before any code is written.

Read this entire file before doing anything else.

---

## What is Spec-Driven Development?

SDD is a workflow where every task is fully specified before it is implemented. The goal is that any agent — even one with no prior context — can pick up any task and implement it correctly by reading a small set of spec files. Context lives in documents, not in conversation history.

The key guarantee: **clearing your context and starting fresh should feel like nothing happened.** The spec files are the memory.

---

## What You Will Produce

By the end of this setup you will have created:

```
<project-root>/
├── AGENTS.md                  # Entry point for every future agent session
├── docs/
│   ├── requirements.md        # Project-level functional + non-functional requirements
│   ├── design.md              # Architecture, data flow, API contracts, component design
│   ├── tasks.md               # Master task list — T-01 through T-NN
│   └── specs/
│       ├── 001-task-slug/     # One folder per task (created when task is picked up)
│       │   ├── requirements.md
│       │   ├── design.md
│       │   ├── tasks.md
│       │   └── review.md      # Written by Spec Guardian after Worker completes
│       └── ...
```

---

## Phase 1 — The Interview

Before writing a single file, interview the user. Your goal is **100% clarity with 0% ambiguity**. Assume a zero error margin: every unanswered question is a potential wasted day of implementation.

### How to conduct the interview

- Ask questions in **focused groups by topic** — 3 to 6 questions per message. Do not ask one at a time; that is too slow. Do not ask 20 at once; that is overwhelming.
- After each group of answers, ask the next group. Continue until you are confident you can write complete specs.
- **Label your questions** (1, 2, 3...) so the user can skip or refer back easily.
- **State your recommendation** when you have one, and give the user a clear choice. Do not present 5 equal options — have a default.
- If the user says "whatever you think is best," commit to a specific choice and explain it in one sentence.

### What to cover in the interview

Work through these topic areas. Not every project needs every topic — skip what does not apply.

**Topic 1 — What is it?**
- What does this project do in one sentence?
- Who uses it and in what context?
- Is it a CLI, a web app, a mobile app, a server, a library?
- Are there any existing codebases, APIs, or services it integrates with?

**Topic 2 — Tech stack**
- What language and runtime? (Node.js, Python, Go, etc.)
- Any frameworks already decided? (Express, Next.js, FastAPI, etc.)
- What is the deployment target? (local machine, VPS, Vercel, Docker, etc.)
- Any hard constraints on dependencies? (no build step, no external services, etc.)

**Topic 3 — Architecture**
- How do the main parts communicate? (HTTP, WebSocket, file system, queues, etc.)
- Is there a database? If so, what kind?
- Is there a frontend? How does it get data — server-rendered, REST, WebSocket?
- Is there a persistent background process, or is it request/response only?

**Topic 4 — Platform and environment constraints**
This topic has caused the most implementation failures in the past. Be specific.
- What OS does this run on? (Linux, macOS, Windows, WSL, iOS, Android?)
- Are there browser or runtime version constraints?
- Does this involve file system access, camera, microphone, Bluetooth, or other device APIs?
- Does it run on a local network, public internet, or both?
- Are there any known security requirements (HTTPS, auth, tokens)?

**Topic 5 — Data and files**
- What data flows through the system? (images, JSON, binary blobs, streams?)
- What are realistic sizes? (a 10 KB JSON vs a 5 MB image vs a 500 MB video changes everything)
- Where is data stored? For how long?
- What happens if storage is full?

**Topic 6 — UI and states**
(Skip if no UI.)
- What screens or views exist?
- What states can the UI be in? (loading, error, empty, populated, etc.)
- What are the most important things visible at a glance?
- What does the user do most frequently?

**Topic 7 — Sessions and lifecycle**
- How long does the app typically run? (seconds, hours, days?)
- Can it be interrupted mid-task? What happens then?
- Is there any state that must survive restarts?
- Are there start/stop/pause controls?

**Topic 8 — Error handling and edge cases**
- What are the most likely failures? (network drops, full disk, bad input, timeout)
- Should failures be silent (log only) or surfaced to the user?
- Is there any recovery logic, or is a restart sufficient?

**Topic 9 — Non-functional requirements**
- How fast does it need to be? (real-time, near-real-time, "just don't be slow")
- Does it need to run unattended for long periods?
- Are there any accessibility requirements?
- Any constraints on memory or CPU usage?

### Known technical gotchas to probe explicitly

These are platform-specific constraints that are easy to miss and hard to debug later. Ask about any that seem relevant to the project:

- **HTTPS on local network**: Many browser APIs (`getUserMedia`, clipboard, service workers, WebCrypto) require a secure context. `http://192.168.x.x` is not secure. If the project involves a phone or tablet accessing a local server, HTTPS is almost certainly required.
- **WSL2 networking**: A server running inside WSL2 is not directly reachable from other devices on the local network. Either run the server natively on Windows, enable WSL2 mirrored networking (`.wslconfig`), or set up netsh portproxy.
- **iOS Safari limitations**: Cannot lock screen orientation via JS. No Web Wake Lock API. `getUserMedia` caps at ~1080p. `blob.arrayBuffer()` requires iOS 14+; use `FileReader` for iOS 11+ compatibility.
- **Binary data over WebSocket**: Socket.IO's default `maxHttpBufferSize` is 1 MB. If you are sending images, audio, or other binary blobs, you must increase this or frames will be silently dropped.
- **File system on Windows/WSL**: Path separators differ. Watch out for `path.join` vs hardcoded `/`. Case sensitivity differs between Linux and Windows.
- **Camera/microphone APIs**: Require user gesture before calling. Must be within a synchronous event handler — not after an `await`.
- **CORS**: If the frontend and backend run on different origins (different ports count), you need explicit CORS headers.
- **Self-signed certs**: Browsers and iOS require installing the certificate authority. mkcert is the easiest tool for local-only HTTPS.
- **Large file uploads**: Default request size limits in Express (`1mb`), nginx, and proxies will silently reject large payloads.
- **Time zones**: `new Date().getHours()` returns local time. `toISOString()` returns UTC. Mixing them causes subtle bugs in schedulers and logs.

### Severity classification

As answers come in, mentally classify each unresolved item:

| Severity | Definition |
|----------|------------|
| **Showstopper** | App cannot function at all without resolving this |
| **Hard failure** | Works during development but fails silently in production or on the real device |
| **Design decision** | User preference — no wrong answer, but must be decided before implementation |
| **Self-resolvable** | You can pick a sensible default without user input |

Always present showstoppers first. Do not bury them in a long list.

---

## Phase 2 — Produce Project-Level Documents

Once the interview is complete, create the following files. Do not start until you have enough information to write them confidently.

### `docs/requirements.md`

Structure:
```markdown
# Requirements — [Project Name]

## Overview
[2–3 sentence plain-English description of what the project does and why.]

## Functional Requirements

### FR-1 — [Feature Group Name]
| ID | Requirement |
|----|-------------|
| FR-1.1 | [Specific, testable requirement] |
| FR-1.2 | ... |

### FR-2 — ...

## Non-Functional Requirements
| ID | Requirement |
|----|-------------|
| NFR-1 | ... |

## Decisions Made During Design
| Decision | Choice | Rationale |
|----------|--------|-----------|
| [What was decided] | [The choice made] | [One-line reason] |

## Known Constraints
[Platform limitations, things that cannot be done due to API/OS/hardware restrictions.]
```

**Rules for requirements:**
- Every requirement must be testable. "Fast" is not testable. "Responds within 2 seconds" is.
- Do not describe implementation, only behaviour. Say what it does, not how.
- Include a Decisions Made table for every non-obvious choice made during the interview. This is institutional memory.

### `docs/design.md`

Structure:
```markdown
# Design — [Project Name]

## Architecture Overview
[ASCII diagram or description of how components relate]

## Components
[One section per major component. Each includes: responsibilities, key interfaces, and anything non-obvious.]

## Data Flow
[Step-by-step description of the most important flows: happy path, error path, recovery path.]

## File & Folder Structure
[The final intended layout of the project directory.]

## API / Event Contract
[All HTTP endpoints, Socket.IO events, or inter-process messages. Tabular format.]

## Dependencies
[Runtime dependencies only, each with a one-line reason for its inclusion.]
```

### `docs/tasks.md`

A phased task list. Every task must have a "Done when" criterion.

```markdown
# Tasks — [Project Name]

## Phase 1 — [Phase Name]

### T-01 · [Task title]
- [Bullet describing what is built]
- [Another bullet]
- **Done when:** [Specific observable outcome]

### T-02 · ...

## Phase 2 — ...
```

**Rules for tasks:**
- Tasks in the same phase should be independently buildable and testable.
- Each task should take roughly half a day to one day of work.
- "Done when" must be observable — something you can check, run, or click.
- Include a final task for end-to-end testing with the real environment (real device, real network, real data sizes).

---

## Phase 3 — Create `AGENTS.md`

`AGENTS.md` sits at the project root. It is the first file any agent reads at the start of a session.

It must contain:

1. **What this project is** — 3–4 sentence plain-English description.
2. **How to orient yourself** — numbered steps every agent must follow before writing code:
   1. Read this file.
   2. Read `docs/requirements.md`.
   3. Read `docs/design.md`.
   4. Read `docs/tasks.md` — identify which tasks are complete, in progress, or not started.
   5. Check `docs/specs/` for the current task's spec folder.
   6. Run `git log --oneline -10` and `git status`.
3. **Documentation structure** — a diagram of the `docs/` layout.
4. **Task numbering convention** — `docs/specs/NNN-task-slug/` where NNN matches T-NN.
5. **Spec folder format** — what each of the three files contains (see Phase 4).
6. **The orchestrator workflow** — how tasks.md is kept up to date.
7. **Workflow for starting a new task** — steps to create a spec folder.
8. **Workflow for continuing a task in progress** — how to read `tasks.md` and resume.
9. **Key constraints** — the most important things an agent must never forget or override.
10. **Master task table** — a quick-reference table of all T-NN tasks with status checkboxes.

---

## Phase 4 — Create Spec Folders

Create `docs/specs/` and one subfolder per task (e.g. `docs/specs/001-project-setup/`). Each subfolder contains exactly three files.

### `requirements.md`

```markdown
## User Story

Given [context],
When [action],
Then [outcome].

## Acceptance Criteria

1. [Specific, testable condition — pass/fail]
2. ...

## Gotchas & Edge Cases

- [Thing that could go wrong that isn't obvious]
- ...
```

**Rules:**
- Acceptance criteria must be specific enough to write a unit test from. "Works correctly" is not an AC. "Returns HTTP 200 with `{ status: 'ok' }` when the request is valid" is.
- Gotchas should document non-obvious constraints, platform-specific behaviour, and things that broke in similar projects before. This is where hard-won knowledge lives.
- If the task has no UI, say so explicitly under a `## UI States` header rather than omitting it.

### `design.md`

```markdown
## UI States

[Every state the UI can be in, described precisely. If no UI: "N/A — no UI in this task."]

| State | Trigger | What the user sees |
|-------|---------|-------------------|
| Loading | Page opens | Spinner centred |
| ...   | ...     | ...               |

## Visual Assets

[Any images, icons, or media referenced. If none: "None."]

## State to Manage

[What data this component or module tracks, and how it changes over time.]

| Variable | Type | Initial value | Changes when |
|----------|------|---------------|--------------|
| ...      | ...  | ...           | ...          |

## Interfaces

[Function signatures, Socket.IO events, HTTP endpoints, or file formats specific to this task.]
```

### `tasks.md`

A flat checklist. No headers. No grouping. One item per line.

```markdown
- [ ] [Atomic step — small enough to verify in isolation]
- [ ] [Another step]
- [ ] [Verification step — run the server, open a browser, check the output]
```

**Rules:**
- Each item must be completable in under 30 minutes.
- Alternate implementation steps with verification steps (build → check → build → check).
- End with at least one real-device or real-environment test.
- The three task states are: `[ ]` (not started), `[~]` (in progress), `[x]` (complete). The agent updates these as it works. This is the only reliable source of truth for task progress across sessions.

---

## The Orchestrator Rule

The `tasks.md` inside each spec folder is the live progress tracker. Agents must update it continuously:

- **Before starting** a step: `[ ]` → `[~]`
- **After completing** a step: `[~]` → `[x]`
- **If blocked**: leave as `[ ]` and append `← BLOCKED: reason`

**Never rely on conversation history to track progress. The spec `tasks.md` is the only durable record.**

When all steps in a spec `tasks.md` are `[x]`, update the master `docs/tasks.md` to mark that task complete.

---

## Phase 5 — Multi-Agent Orchestration

Once specs are confirmed and implementation begins, use a three-agent loop. Do not attempt to implement everything in a single agent conversation.

### The Three Roles

**Orchestrator** — stays alive across the whole project. Reads `AGENTS.md` and `docs/tasks.md` to track state. Spawns and terminates Workers and Spec Guardians. Never writes code itself.

**Worker** — spawned for one task at a time. Receives the spec folder and relevant existing code. Implements, updates `tasks.md` checkboxes (`[ ]` → `[~]` → `[x]`), then terminates.

**Spec Guardian** — spawned after each Worker. Receives the spec folder and changed code files. Checks every acceptance criterion against the code. Writes findings to `review.md`. Terminates. The Orchestrator reads the file.

### The Loop

```
Orchestrator → spawn Worker → Worker implements task
            → spawn Spec Guardian → Guardian writes review.md
            → Orchestrator reads review.md

  FAIL    → spawn new Worker (with review.md as additional context) → repeat
  PASS    → mark task complete in docs/tasks.md → next task
  PARTIAL → mark complete, defer ⚠️ MANUAL ACs to end-to-end test task
```

### The `review.md` File

Every spec folder contains a `review.md`. It starts as PENDING and is filled in by the Spec Guardian. Format:

```markdown
# Review — T-NN · Task Title
Status: PASS | FAIL | PARTIAL

## Acceptance Criteria Results
| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | [AC text] | ✅ PASS | |
| 2 | [AC text] | ❌ FAIL | [reason + file:line] |
| 3 | [AC text] | ⚠️ MANUAL | Requires physical device — deferred to E2E test |

## Verdict
PASS | FAIL | PARTIAL

## Issues Found
[Specific: what is wrong and where in the code.]

## Recommendation
SHIP | FIX: [instructions for next Worker] | MANUAL-TEST-NEEDED
```

The `review.md` is **the Orchestrator's memory**. It survives context resets. If the Orchestrator is restarted, it reads all `review.md` files to reconstruct project state without asking the user anything.

### When to Parallelise

Parallelism is only worth the coordination overhead when tasks are genuinely independent (touch different files). For most projects:

- **Sequential phase** (early tasks building the foundation): one Worker at a time
- **Panel/feature phase** (independent UI sections, independent endpoints): 2–3 Workers in parallel, then 2–3 Guardians in parallel
- **Integration phase** (E2E testing, README): single Worker, sequential

Do not parallelise tasks that touch the same file. The merge overhead exceeds the time saved.

### Physical Hardware Limitation

The Spec Guardian cannot verify ACs requiring a real device (camera, QR scan, network behaviour, screen wake-lock). Mark these `⚠️ MANUAL` — not FAIL. Collect all MANUAL ACs and verify them together in the end-to-end test task.

---

## Workflow Summary

```
1.  Read this file fully
2.  Interview the user (grouped questions, relentless, until 100% clear)
3.  Write docs/requirements.md
4.  Write docs/design.md
5.  Write docs/tasks.md
6.  Write AGENTS.md
7.  Create docs/specs/ with one subfolder per task
8.  Write requirements.md, design.md, tasks.md, review.md for each spec folder
9.  Present the specs to the user for review
10. Get confirmation before any code is written
11. Begin implementation using the Orchestrator → Worker → Spec Guardian loop
```

---

## Lessons from Past Projects

These are hard-won lessons from running this workflow. Learn from them.

**On the interview:**
- The most dangerous answer is "whatever you think is best." Commit to a specific choice, state the trade-off in one sentence, and ask if it is acceptable. Do not leave it open.
- Platform-specific constraints (HTTPS requirements, OS networking, browser API gaps) are the most common source of blocked implementations. Ask about them explicitly, early.
- Ask about realistic data sizes. A design that works for a 10 KB JSON can completely fail for a 5 MB image. Socket.IO, Express, nginx — all have default limits that will bite you silently.
- Separate what the user decides from what you can default. Ask about decisions. Don't ask permission for defaults.

**On writing specs:**
- Acceptance criteria that are vague will produce implementations that are technically correct but wrong. "The button works" is not an AC. "Clicking the button emits `start-session` and disables the button until `session-started` is received" is.
- Every gotcha should be something that has actually failed or could plausibly fail. Do not write generic warnings — write specific ones.
- When a decision is made during the interview, it should appear in three places: the Decisions table in `docs/requirements.md`, the relevant spec's `requirements.md` gotchas, and the relevant spec's `tasks.md` as a concrete step.

**On the orchestrator workflow:**
- The `[~]` (in progress) state matters. Without it, a new agent cannot tell whether a step was interrupted mid-way or never started.
- Keep task steps small. A step that takes 3 hours cannot be marked `[~]` meaningfully — it should be broken into smaller steps.
- The spec `tasks.md` is not a plan. It is a log. It reflects actual progress, including steps that were skipped, blocked, or done out of order.

**On multi-agent orchestration:**
- The Spec Guardian's fresh context is its only value. Do not let the Worker review its own work — it will rationalise failures away.
- The `review.md` file is more important than the Guardian's return message. The message disappears when context clears; the file does not.
- `⚠️ MANUAL` is a valid and correct AC result. Do not force Guardians to mark device-dependent tests as PASS or FAIL — they cannot know. Collect all MANUAL ACs and test them together in the final E2E task.
- The Orchestrator should never accumulate more than ~15 tasks of context before being restarted. The `review.md` files exist precisely so it can resume without loss.
- Role-based agents (architect, PM, QA) create waiting time. File-based agents (each Worker owns specific files) create parallelism. Prefer file ownership over role when deciding how to split work.

**On AGENTS.md:**
- The orientation sequence (read these files in this order) must be followed literally. An agent that skips the design doc will make architectural decisions that contradict it.
- The master task table in AGENTS.md is a quick reference, not the source of truth. Always read `docs/tasks.md` for full descriptions and `docs/specs/NNN/tasks.md` for current progress.
- Key constraints in AGENTS.md should be the things an agent would most plausibly get wrong. Not a list of everything — the short list of the things that actually matter most.
