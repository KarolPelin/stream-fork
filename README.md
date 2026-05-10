# Stream Fork

Media aggregation platform — Stremio addon ecosystem + open backend.

## What It Is

Cross-platform media streaming app (Android + iOS) that aggregates movies/TV from Stremio addons and custom scrapers, with debrid service support and an open, self-hostable backend.

## Project Structure

```
stream-fork/
├── backend/          # Node.js API (user auth, library sync, addon discovery)
├── mobile/           # Kotlin Multiplatform app (NuvioMobile fork)
├── docs/             # Architecture docs, API spec
└── README.md
```

## Tech Stack

- **Mobile:** Kotlin Multiplatform + Jetpack Compose + MPVKit/ExoPlayer
- **Backend:** Node.js + Express + SQLite/PostgreSQL
- **Platforms:** Android, iOS (requires Mac/Xcode)

## License

MIT

## Status

Development starting — see project board for progress.