---
name: nuvio-streaming-platform
description: Building a Nuvio-based streaming platform fork with open backend and Stremio addon compatibility
last_updated: 2026-05-10
owner: Karol Pelin
vps: hermes-sync
macbook: pending
---

# Nuvio Streaming Platform Fork

## Project Overview

**Name:** TBD (clean break from Nuvio/Stremio naming)
**Goal:** Build a better media aggregation app that works like Nuvio/Stremio but with an open backend, better UX, and reliability fixes.
**License:** MIT (for backend and Karol's contributions)

## What It Is

A cross-platform media streaming app (Android + iOS) that lets users:
1. Add Stremio addons via manifest URL
2. Add custom scraper repos from GitHub
3. Connect debrid services (Real-Debrid, AllDebrid, Premiumize, etc.)
4. Browse movies/TV from addon catalogs
5. Watch via cached debrid streams or direct scraper links

## Architecture

```
User → Mobile App → Backend API → Debrid Services / Scraper Repos
                    ↓
              User Accounts
              Library Sync
              Addon Discovery
              Trakt Sync
```

## Tech Stack

### Mobile App
- **Framework:** Kotlin Multiplatform + Jetpack Compose
- **Sources:** NuvioMedia/NuvioMobile (MIT licensed, cmp-rewrite branch)
- **Playback:** MPVKit (iOS), ExoPlayer (Android)
- **Storage:** MMKV (local key-value)
- **Platforms:** Android (APK), iOS (Xcode build via Mac)

### Backend
- **Runtime:** Node.js (VPS)
- **Database:** SQLite or PostgreSQL
- **Features:**
  - User accounts + JWT auth
  - Library sync (cross-device)
  - Addon discovery service
  - Debrid account linking (API key storage)
  - Trakt.tv sync service
  - Scraper health monitoring + failover logic

## Features

### Phase 1 (MVP)
- [ ] Fork NuvioMobile codebase, study architecture
- [ ] Fix broken cmp-rewrite bugs (manifest.json handling, missing UI features)
- [ ] Build open backend API (user auth, library sync)
- [ ] Debrid one-tap wizard (Real-Debrid, AllDebrid, Premiumize, DebridLink)
- [ ] Addon repo management (add via manifest URL)
- [ ] Scraper auto-failover (when one source dies, switch to another)
- [ ] Trakt.tv integration that actually works

### Phase 2 (Polish)
- [ ] Better metadata aggregation (TMDB + IMDB + RT all in one view)
- [ ] Video fit mode controls
- [ ] Subtitle styling (dark backgrounds)
- [ ] Library filtering (unwatched season, year-based)

### Phase 3 (Launch)
- [ ] Android APK build + test
- [ ] iOS build (requires Mac/Xcode)
- [ ] Self-hosting docs for backend
- [ ] Optional: hosted version with affiliate debrid links

## Key Repositories

### Base (MIT Licensed)
- NuvioMobile: https://github.com/NuvioMedia/NuvioMobile
- stremio-core (Rust): https://github.com/Stremio/stremio-core
- stremio-addon-sdk: https://github.com/Stremio/stremio-addon-sdk

### Scraper Repos (for integration testing)
- https://github.com/yoruix/nuvio-providers
- https://github.com/D3dlyRocket/All-in-One-Nuvio

## Common Tasks

### Clone and study NuvioMobile
```bash
cd /opt
git clone https://github.com/NuvioMedia/NuvioMobile.git
cd NuvioMobile
# Switch to cmp-rewrite branch (Kotlin Multiplatform rewrite)
git checkout cmp-rewrite
# Study structure
find . -name "*.kt" | head -50
```

### Run Android build
```bash
cd NuvioMobile
./gradlew assembleDebug
# APK: composeApp/build/outputs/apk/debug/
```

### Run iOS build (Mac only)
```bash
cd NuvioMobile/iosApp
xcodebuild -workspace Nuvio.xcworkspace -scheme Nuvio -configuration Debug -destination 'platform=iOS Simulator name=iPhone 16 Pro' build
```

### Start backend dev server
```bash
cd /opt/nuvio-backend
npm run dev
```

## Debrid Affiliate Potential

Real-Debrid pays ~10-15% commission. A user with 1000 active referals at $5/month = $500-750/month passive.

## Build Services (for iOS without Mac)

1. **Voltality** — cloud macOS builds, paid
2. **GitHub Actions macOS runner** — free tier limited
3. **MacStadium** — cloud Mac minis, paid

## Current Status

- [x] Research complete (Stremio + Nuvio deep dive)
- [x] Project scope defined
- [ ] NuvioMobile codebase cloned + studied
- [ ] Backend architecture designed
- [ ] Codex CLI configured for code generation
- [ ] Development started

## Notes for Agent

- Karol is 15-16, West Career and Technical Academy, Las Vegas
- He wants direct, concise answers — no hand-holding
- Heavy late-night work sessions
- Use Codex CLI (codex) for coding tasks
- Model: codex-5.5
- Tony Stark persona
- Keep API keys/tokens hidden