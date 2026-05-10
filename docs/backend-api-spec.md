# Stream Fork — Backend API Specification

## Overview

Node.js + Express backend. Self-hostable. MIT license.

**Base URL:** `http://localhost:3000/api/v1` (dev) / `https://api.streamfork.app/api/v1` (prod)

## Tech Stack

- Express.js
- SQLite (dev) → PostgreSQL (prod)
- JWT for auth
- bcrypt for password hashing

## Database Schema

### Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Devices
```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  last_seen DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Library (cross-device sync)
```sql
CREATE TABLE library (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'movie' | 'series'
  imdb_id TEXT NOT NULL,
  watched_episodes TEXT, -- JSON array for series
  watch_progress REAL DEFAULT 0, -- seconds
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, imdb_id)
);
```

### Addons (user's installed addons)
```sql
CREATE TABLE user_addons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  manifest_url TEXT NOT NULL,
  name TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Debrid Accounts
```sql
CREATE TABLE debrid_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'realdebrid' | 'alldebrid' | 'premiumize' | 'debridlink'
  api_key TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Trakt Sync
```sql
CREATE TABLE trakt_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Endpoints

### Auth

**POST /api/v1/auth/register**
```json
Request:  { "email": "x@y.com", "password": "abc123" }
Response: { "user": { "id": "uuid", "email": "x@y.com" }, "token": "jwt..." }
```

**POST /api/v1/auth/login**
```json
Request:  { "email": "x@y.com", "password": "abc123" }
Response: { "user": { "id": "uuid", "email": "x@y.com" }, "token": "jwt..." }
```

**POST /api/v1/auth/logout**
```
Headers: Authorization: Bearer <token>
Response: { "ok": true }
```

---

### Library Sync

**GET /api/v1/library**
```
Headers: Authorization: Bearer <token>
Response: { "items": [ { "id", "type", "imdb_id", "watched_episodes": [], "watch_progress": 0 } ] }
```

**PUT /api/v1/library/:imdb_id**
```json
Headers: Authorization: Bearer <token>
Body: { "type": "movie" | "series", "watched_episodes": [1,2,3], "watch_progress": 3600 }
Response: { "ok": true, "item": { ... } }
```

**DELETE /api/v1/library/:imdb_id**
```
Headers: Authorization: Bearer <token>
Response: { "ok": true }
```

**POST /api/v1/library/sync** (batch update from device)
```json
Headers: Authorization: Bearer <token>
Body: { "items": [ { "imdb_id", "type", "watched_episodes", "watch_progress" } ] }
Response: { "ok": true, "synced": 5 }
```

---

### Addon Discovery

**GET /api/v1/addons**
```
Headers: Authorization: Bearer <token>
Response: { "addons": [ { "id", "name", "manifest_url", "added_at" } ] }
```

**POST /api/v1/addons**
```json
Headers: Authorization: Bearer <token>
Body: { "manifest_url": "https://example.com/manifest.json" }
Response: { "addon": { "id", "name", "manifest_url", "manifest": { ...parsed manifest } } }
```

**DELETE /api/v1/addons/:id**
```
Headers: Authorization: Bearer <token>
Response: { "ok": true }
```

**GET /api/v1/addons/discover** (curated addon list)
```
Headers: Authorization: Bearer <token>
Response: { "addons": [ { "name", "manifest_url", "description", "stars" } ] }
```

---

### Debrid Service

**GET /api/v1/debrid**
```
Headers: Authorization: Bearer <token>
Response: { "accounts": [ { "id", "provider", "active": true } ] }
```

**POST /api/v1/debrid**
```json
Headers: Authorization: Bearer <token>
Body: { "provider": "realdebrid", "api_key": "..." }
Response: { "account": { "id", "provider", "active": true }, "balance": "..." }
```

**DELETE /api/v1/debrid/:id**
```
Headers: Authorization: Bearer <token>
Response: { "ok": true }
```

**POST /api/v1/debrid/:id/check** (verify account still valid)
```
Headers: Authorization: Bearer <token>
Response: { "valid": true, "balance": "..." }
```

---

### Trakt Sync

**POST /api/v1/trakt/link**
```json
Headers: Authorization: Bearer <token>
Body: { "access_token": "...", "refresh_token": "...", "expires_at": "ISO8601" }
Response: { "account": { "id", "linked": true } }
```

**GET /api/v1/trakt**
```
Headers: Authorization: Bearer <token>
Response: { "linked": true, "user": "username" }
```

**DELETE /api/v1/trakt**
```
Headers: Authorization: Bearer <token>
Response: { "ok": true }
```

**POST /api/v1/trakt/sync** (sync watch history to Trakt)
```json
Headers: Authorization: Bearer <token>
Body: { "items": [ { "imdb_id", "watched", "progress" } ] }
Response: { "ok": true, "synced": 10 }
```

---

### Scraper Health

**GET /api/v1/scrapers/status**
```
Headers: Authorization: Bearer <token>
Response: {
  "scrapers": [
    { "name": "hdfilmcehennemi", "status": "online", "last_check": "2026-05-10T..." },
    { "name": "netmirror", "status": "offline", "last_error": "..." }
  ]
}
```

**POST /api/v1/scrapers/report** (app reports broken scraper)
```json
Headers: Authorization: Bearer <token>
Body: { "scraper": "netmirror", "error": "404 on movies", "addon": "..." }
Response: { "ok": true }
```

---

## Middleware

### authMiddleware
- Reads `Authorization: Bearer <token>` header
- Verifies JWT, attaches `req.user = { id, email }`
- Returns 401 if invalid/missing

### rateLimitMiddleware
- 100 req/min per IP for unauthenticated endpoints
- 500 req/min per user for authenticated endpoints

---

## Error Responses

All errors follow format:
```json
{ "error": { "code": "INVALID_TOKEN", "message": "JWT has expired" } }
```

| Code | HTTP |
|------|------|
| INVALID_TOKEN | 401 |
| NOT_FOUND | 404 |
| VALIDATION_ERROR | 400 |
| RATE_LIMITED | 429 |
| INTERNAL_ERROR | 500 |

---

## Environment Variables

```
PORT=3000
DATABASE_URL=sqlite://./data.db
JWT_SECRET=<generate-with-openssl-rand-base64-32>
CORS_ORIGIN=http://localhost:8080
```

---

## Status

- [x] API spec written
- [ ] Code: auth routes
- [ ] Code: library routes
- [ ] Code: addon routes
- [ ] Code: debrid routes
- [ ] Code: trakt routes
- [ ] Database migrations
- [ ] JWT middleware
- [ ] Test endpoint