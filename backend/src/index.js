require('dotenv').config();
const express = require('express');
const cors = require('cors');

const messagesRouter = require('./routes/messages');
const statsRouter = require('./routes/stats');
const summaryRouter = require('./routes/summary');
const webhookRouter = require('./routes/webhook');
const eventsRouter = require('./routes/events');
const auth = require('./middleware/auth');
const { isLiveConfigured } = require('./adapters/whatsapp');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
// Stash the raw body bytes alongside the parsed JSON — the webhook signature
// check needs to hash the exact bytes Meta sent, not a re-serialized copy.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'thrive-whatsapp-backend',
    timestamp: new Date().toISOString(),
    whatsappLive: isLiveConfigured(),
    authRequired: !!process.env.DASHBOARD_API_KEY,
  });
});

// API Routes — dashboard routes are gated by DASHBOARD_API_KEY (see ./middleware/auth).
// The webhook is NOT gated by it: Meta calls that endpoint directly and
// authenticates via WHATSAPP_VERIFY_TOKEN on the GET handshake instead.
app.use('/api/messages', auth, messagesRouter);
app.use('/api/stats', auth, statsRouter);
app.use('/api/summary', auth, summaryRouter);
app.use('/api/events', auth, eventsRouter);
app.use('/api/webhook', webhookRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Thrive WhatsApp Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'} (WhatsApp ${isLiveConfigured() ? 'LIVE' : 'mock'} — messages persisted to backend/data/store.json)`);
});
