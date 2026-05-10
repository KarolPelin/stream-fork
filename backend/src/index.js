const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const libraryRoutes = require('./routes/library');
const addonRoutes = require('./routes/addons');
const debridRoutes = require('./routes/debrid');
const traktRoutes = require('./routes/trakt');
const scraperRoutes = require('./routes/scrapers');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Init database
initDb();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

// Health check (no auth)
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/v1/health', (req, res) => res.json({ ok: true, version: '0.1.0' }));

// Auth routes (rate limited)
app.use('/api/v1/auth', authLimiter, authRoutes);

// Protected routes
app.use('/api/v1/library', authMiddleware, libraryRoutes);
app.use('/api/v1/addons', authMiddleware, addonRoutes);
app.use('/api/v1/debrid', authMiddleware, debridRoutes);
app.use('/api/v1/trakt', authMiddleware, traktRoutes);
app.use('/api/v1/scrapers', authMiddleware, scraperRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

app.listen(PORT, () => {
  console.log(`Stream Fork API running on port ${PORT}`);
});

module.exports = app;