const express = require('express');
const router = express.Router();
const whatsapp = require('../adapters/whatsapp');

// GET /api/messages?filter=all|unread|important|inbound&search=&limit=50
router.get('/', async (req, res) => {
  try {
    const { filter = 'all', search = '', limit = 50 } = req.query;
    const messages = await whatsapp.getMessages({ filter, search, limit: parseInt(limit) });
    res.json({ success: true, data: messages, count: messages.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await whatsapp.getConversations();
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/messages/send
router.post('/send', async (req, res) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ success: false, error: 'to and body are required' });
    const result = await whatsapp.sendMessage({ to, body });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
