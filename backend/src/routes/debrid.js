const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Debrid provider configs
const PROVIDER_APIS = {
  realdebrid: { base: 'https://api.real-debrid.com/rest/1.0', label: 'Real-Debrid' },
  alldebrid: { base: 'https://api.alldebrid.com/v4', label: 'AllDebrid' },
  premiumize: { base: 'https://api.premiumize.me', label: 'Premiumize' },
  debridlink: { base: 'https://api.debrid-link.fr/2.0', label: 'DebridLink' },
};

// GET /debrid (list user's debrid accounts)
router.get('/', (req, res) => {
  const db = getDb();
  const accounts = db.prepare('SELECT id, provider, active, updated_at FROM debrid_accounts WHERE user_id = ?').all(req.user.id);
  res.json({ accounts });
});

// POST /debrid (add debrid account)
router.post('/', async (req, res) => {
  const { provider, api_key } = req.body;
  if (!provider || !api_key) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'provider and api_key required' } });
  }
  if (!PROVIDER_APIS[provider]) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Unknown provider' } });
  }

  // Validate API key by calling provider
  let valid = false;
  let balance = null;
  try {
    if (provider === 'realdebrid') {
      const r = await fetch(`${PROVIDER_APIS.realdebrid.base}/account`, {
        headers: { Authorization: `Bearer ${api_key}` }
      });
      if (r.ok) { valid = true; const d = await r.json(); balance = d.premium; }
    } else if (provider === 'alldebrid') {
      const r = await fetch(`${PROVIDER_APIS.alldebrid.base}/user?token=${api_key}`);
      if (r.ok) { valid = true; const d = await r.json(); balance = d.user.premium; }
    } else if (provider === 'premiumize') {
      const r = await fetch(`${PROVIDER_APIS.premiumize.base}/account`, { headers: { Authorization: api_key } });
      if (r.ok) { valid = true; balance = true; }
    } else if (provider === 'debridlink') {
      const r = await fetch(`${PROVIDER_APIS.debridlink.base}/account`, { headers: { Authorization: api_key } });
      if (r.ok) { valid = true; balance = true; }
    }
  } catch (err) {
    valid = false;
  }

  if (!valid) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid API key' } });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO debrid_accounts (id, user_id, provider, api_key) VALUES (?, ?, ?, ?)').run(id, req.user.id, provider, api_key);
  res.status(201).json({ account: { id, provider, active: true }, balance });
});

// DELETE /debrid/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM debrid_accounts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// POST /debrid/:id/check
router.post('/:id/check', async (req, res) => {
  const db = getDb();
  const account = db.prepare('SELECT * FROM debrid_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!account) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found' } });

  let valid = false;
  try {
    const r = await fetch(`${PROVIDER_APIS[account.provider].base}/account`, {
      headers: { Authorization: `Bearer ${account.api_key}` }
    });
    valid = r.ok;
  } catch {}

  if (!valid) {
    db.prepare('UPDATE debrid_accounts SET active = 0 WHERE id = ?').run(account.id);
  }

  res.json({ valid, provider: account.provider });
});

module.exports = router;