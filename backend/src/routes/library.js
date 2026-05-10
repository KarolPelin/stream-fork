const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// GET /library
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM library WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  const parsed = items.map(item => ({ ...item, watched_episodes: JSON.parse(item.watched_episodes || '[]') }));
  res.json({ items: parsed });
});

// PUT /library/:imdb_id
router.put('/:imdb_id', (req, res) => {
  const { imdb_id } = req.params;
  const { type, title, poster, watched_episodes, watch_progress } = req.body;

  if (!type || !['movie', 'series'].includes(type)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'type must be movie or series' } });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM library WHERE user_id = ? AND imdb_id = ?').get(req.user.id, imdb_id);

  if (existing) {
    db.prepare(`
      UPDATE library SET type=?, title=?, poster=?, watched_episodes=?, watch_progress=?, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=? AND imdb_id=?
    `).run(type, title || null, poster || null, JSON.stringify(watched_episodes || []), watch_progress || 0, req.user.id, imdb_id);
  } else {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO library (id, user_id, type, imdb_id, title, poster, watched_episodes, watch_progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, type, imdb_id, title || null, poster || null, JSON.stringify(watched_episodes || []), watch_progress || 0);
  }

  const item = db.prepare('SELECT * FROM library WHERE user_id = ? AND imdb_id = ?').get(req.user.id, imdb_id);
  res.json({ ok: true, item: { ...item, watched_episodes: JSON.parse(item.watched_episodes || '[]') } });
});

// DELETE /library/:imdb_id
router.delete('/:imdb_id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM library WHERE user_id = ? AND imdb_id = ?').run(req.user.id, req.params.imdb_id);
  res.json({ ok: true });
});

// POST /library/sync
router.post('/sync', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'items must be an array' } });
  }

  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO library (id, user_id, type, imdb_id, title, poster, watched_episodes, watch_progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, imdb_id) DO UPDATE SET
      type=excluded.type, title=excluded.title, poster=excluded.poster,
      watched_episodes=excluded.watched_episodes, watch_progress=excluded.watch_progress, updated_at=CURRENT_TIMESTAMP
  `);

  let count = 0;
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      upsert.run(
        uuidv4(), req.user.id, item.type, item.imdb_id,
        item.title || null, item.poster || null,
        JSON.stringify(item.watched_episodes || []), item.watch_progress || 0
      );
      count++;
    }
  });

  insertMany(items);
  res.json({ ok: true, synced: count });
});

module.exports = router;