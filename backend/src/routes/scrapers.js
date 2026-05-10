const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Scraper health monitoring
const SCRAPER_STATUS = {
  'hdfilmcehennemi': { status: 'online', last_check: new Date().toISOString() },
  'netmirror': { status: 'online', last_check: new Date().toISOString() },
  'gdriveplayer': { status: 'online', last_check: new Date().toISOString() },
  '2embed': { status: 'offline', last_check: new Date().toISOString(), last_error: 'domain changed' },
};

// GET /scrapers/status
router.get('/status', (req, res) => {
  res.json({
    scrapers: Object.entries(SCRAPER_STATUS).map(([name, data]) => ({ name, ...data }))
  });
});

// POST /scrapers/report (app reports broken scraper)
router.post('/report', (req, res) => {
  const { scraper, error, addon } = req.body;
  if (!scraper) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'scraper name required' } });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO scraper_reports (id, scraper, addon, error, reported_by) VALUES (?, ?, ?, ?, ?)')
    .run(id, scraper, addon || null, error || null, req.user.id);

  // Mark scraper as potentially offline
  if (SCRAPER_STATUS[scraper]) {
    SCRAPER_STATUS[scraper].status = 'unknown';
    SCRAPER_STATUS[scraper].last_error = error;
  }

  res.json({ ok: true });
});

module.exports = router;