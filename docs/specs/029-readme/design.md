## UI States

N/A — no UI in this task. This task produces a static Markdown document.

## Visual Assets

None. The README may reference the QR code endpoint (`/qr`) as a URL but does not embed any images inline.

## State to Manage

N/A — the README is a static document with no runtime state.

## Interfaces

**Output artefact:**
```
/home/mephysto/projects/phone-timelapse/README.md
```

**Proposed document structure (section order):**

1. Title and one-sentence description
2. Requirements
3. Setup
4. Connecting the phone
5. Running a session
6. Scheduled sessions (auto-start / auto-stop)
7. Output files
8. Post-processing (FFmpeg command)
9. Disk space estimates (table: format × session length)
10. Known limitations
11. Troubleshooting (brief: phone won't connect, blank camera, wake-lock)

This structure ensures a new user can read top-to-bottom and take action at each step before moving on.
