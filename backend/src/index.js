require('dotenv').config();
const express = require('express');
const cors = require('cors');

const messagesRouter = require('./routes/messages');
const statsRouter = require('./routes/stats');
const summaryRouter = require('./routes/summary');
const webhookRouter = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'thrive-whatsapp-backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/messages', messagesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/summary', summaryRouter);
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
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'} (mock data active)`);
});
