const express = require('express');
const router = express.Router();
const { classifyMessage } = require('../services/classifier');

/**
 * WhatsApp Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Meta requires a GET verification handshake before sending events.
 * Once verified, POST events arrive here for every inbound message.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// GET /api/webhook — Meta verification handshake
router.get('/', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'thrive_verify_token';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verified successfully');
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Verification failed' });
});

// POST /api/webhook — Incoming messages from WhatsApp
router.post('/', (req, res) => {
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        const value = change.value;
        if (value.messages) {
          value.messages.forEach(async msg => {
            const body = msg.text?.body || msg.button?.text || '';
            const classification = await classifyMessage({
              id: msg.id,
              direction: 'inbound',
              body,
              contactId: msg.from,
            });
            console.log('[Webhook] Inbound message:', msg.id, '→', classification);
            // TODO: Save { ...msg, ...classification } to DB / emit via websocket to frontend
          });
        }
      });
    });
    res.status(200).json({ status: 'received' });
  } else {
    res.status(404).json({ error: 'Not a WhatsApp event' });
  }
});

module.exports = router;
