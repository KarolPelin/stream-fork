const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Curated addon list (public discovery)
const CURATED_ADDONS = [
  { name: 'Torrentio', manifest_url: 'https://torrentio.strem.things/', description: 'Torrent + debrid', stars: 5000 },
  { name: 'Cinemeta', manifest_url: 'https://cinemeta.stremio.com/', description: 'Metadata (TMDB)', stars: 3000 },
  { name: 'Simplerim', manifest_url: 'https://simplerim.gq/', description: 'Direct links', stars: 800 },
  { name: 'Animal', manifest_url: 'https://animal.stremio.xyz/', description: 'Movies + TV', stars: 1200 },
];

// GET /addons (user's addons)
router.get('/', (req, res) => {
  const db = getDb();
  const addons = db.prepare('SELECT * FROM user_addons WHERE user_id = ? ORDER BY added_at DESC').all(req.user.id);
  res.json({ addons });
});

// GET /addons/discover (curated list)
router.get('/discover', (req, res) => {
  res.json({ addons: CURATED_ADDONS });
});

// POST /addons (add new addon via manifest URL)
router.post('/', async (req, res) => {
  const { manifest_url } = req.body;
  if (!manifest_url) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'manifest_url required' } });
  }

  // Fetch and parse manifest
  let manifest;
  try {
    const response = await fetch(manifest_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest = await response.json();
  } catch (err) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Failed to fetch manifest: ${err.message}` } });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO user_addons (id, user_id, manifest_url, name, logo)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, manifest_url, manifest.name || 'Unknown', manifest.logo || null);

  const addon = db.prepare('SELECT * FROM user_addons WHERE id = ?').get(id);
  res.status(201).json({ addon, manifest });
});

// DELETE /addons/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const addon = db.prepare('SELECT * FROM user_addons WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addon) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Addon not found' } });

  db.prepare('DELETE FROM user_addons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;