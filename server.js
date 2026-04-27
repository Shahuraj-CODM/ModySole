// ============================================================
// MODYSOLE — Production Server
// ============================================================
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Headers ──
app.use(helmet({
  contentSecurityPolicy: false,        // Allow CDN scripts (Three.js, Supabase, Font Awesome)
  crossOriginEmbedderPolicy: false,    // Allow loading GLB models from GitHub
}));

// ── Gzip Compression ──
app.use(compression());

// ── Cache Control ──
app.use((req, res, next) => {
  const ext = path.extname(req.url);
  if (['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2'].includes(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
  } else if (ext === '.html' || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache');                // Always fresh HTML
  }
  next();
});

// ── CORS (for Supabase) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

// ── Serve Static Files ──
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],   // /about → about.html
  index: 'index.html',
}));

// ── Fallback: send index.html for any unknown route ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║          🟢 ModySOLE is LIVE            ║
  ║                                          ║
  ║   Local:   http://localhost:${PORT}         ║
  ║   Network: http://0.0.0.0:${PORT}          ║
  ╚══════════════════════════════════════════╝
  `);
});
