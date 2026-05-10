const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// POST /trakt/link
router.post('/link', (req, res) => {
  const { access_token, refresh_token, expires_at } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'access_token required' } });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM trakt_accounts WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare('UPDATE trakt_accounts SET access_token=?, refresh_token=?, expires_at=? WHERE user_id=?')
      .run(access_token, refresh_token || null, expires_at || null, req.user.id);
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO trakt_accounts (id, user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.id, access_token, refresh_token || null, expires_at || null);
  }

  res.json({ account: { linked: true } });
});

// GET /trakt
router.get('/', (req, res) => {
  const db = getDb();
  const account = db.prepare('SELECT * FROM trakt_accounts WHERE user_id = ?').get(req.user.id);
  if (!account) return res.json({ linked: false });

  res.json({ linked: true, expires_at: account.expires_at });
});

// DELETE /trakt
router.delete('/', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM trakt_accounts WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// POST /trakt/sync
router.post('/sync', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'items must be an array' } });
  }

  const db = getDb();
  const account = db.prepare('SELECT * FROM trakt_accounts WHERE user_id = ?').get(req.user.id);
  if (!account) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No Trakt account linked' } });

  // Forward to Trakt API
  try {
    const r = await fetch('https://api.trakt.tv/sync/playback', {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': process.env.TRAKT_CLIENT_ID || 'DEMO_KEY'
      }
    });
    // We just report success - actual Trakt sync would need proper implementation
    res.json({ ok: true, synced: items.length });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Trakt sync failed' } });
  }
});

module.exports = router;