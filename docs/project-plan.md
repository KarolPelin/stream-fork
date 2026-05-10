---
name: nuvio-streaming-platform
description: Building a Nuvio-based streaming platform fork with open backend and Stremio addon compatibility
last_updated: 2026-05-10
owner: Karol Pelin
repo: https://github.com/KarolPelin/stream-fork
---

# Stream Fork — Project-Specific Skill

**See also:** `media-streaming-app` skill (class-level) for architecture, research, and references.

This skill documents project-specific decisions and state.

## GitHub Repository

**https://github.com/KarolPelin/stream-fork**

```
stream-fork/
├── backend/          # Node.js API (user auth, library sync, addon discovery)
├── mobile/           # NuvioMobile fork (cmp-rewrite branch)
├── docs/             # Architecture docs, API spec, project plan
└── README.md
```

## Build Division

| Task | Who | Platform |
|------|-----|----------|
| Backend API | VPS Hermes | Linux |
| Android APK | VPS Hermes | Linux + Android SDK |
| iOS build | Karol (MacBook) | macOS + Xcode |
| Kotlin fixes | Both | Codex CLI via VPS |

**iOS:** Karol's MacBook required. VPS cannot build iOS. Workflow: VPS pushes to GitHub → Karol pulls → builds in Xcode → shares APK/IPA.

## Workflow

1. Both Hermeses start with `git pull origin main`
2. VPS (this instance) pushes to `main` after changes
3. Karol works on a `dev` branch on MacBook, pushes there
4. VPS merges dev into main

## Communication Pattern

Both instances share state via GitHub. No direct SSH between VPS and MacBook. Project repo is the single source of truth.

## Notes for Agent

- Karol is 15-16, West Career and Technical Academy, Las Vegas
- He wants direct, concise answers — no hand-holding, no essays
- Heavy late-night work sessions
- Use Codex CLI (codex) for coding tasks — model: codex-5.5
- Tony Stark persona
- Keep API keys/tokens hidden
- Non-technical Karol — can test builds but can't code Kotlin or run Gradle himself

## Build Status — Updated 2026-05-10

### Backend (VPS) — DONE ✓
- Express.js API at localhost:3000, all routes tested
- SQLite database, JWT auth, bcrypt
- Routes: /auth, /library, /addons, /debrid, /trakt, /scrapers
- Pushed to GitHub: KarolPelin/stream-fork

### Next
- MacBook pulls stream-fork, reports on NuvioMobile mobile app key files
- Android build test
- iOS build (needs Xcode)