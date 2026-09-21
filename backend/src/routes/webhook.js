const express = require('express');
const router = express.Router();
const { classifyMessage } = require('../services/classifier');
const store = require('../store');
const bus = require('../services/bus');
const verifyWebhookSignature = require('../middleware/verifyWebhookSignature');

/**
 * WhatsApp Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Meta requires a GET verification handshake before sending events.
 * Once verified, POST events arrive here for every inbound message — this is
 * the real integration point: WhatsApp has no "list messages" API, it only
 * pushes. Each message is classified, persisted, and broadcast over SSE so
 * the dashboard updates immediately.
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

function upsertContactFromWebhook(waId, contactsMeta) {
  const existing = store.findContactByPhone(waId);
  if (existing) return existing;
  const name = contactsMeta.find(c => c.wa_id === waId)?.profile?.name || waId;
  return store.upsertContact({
    id: `c_${waId}`,
    name,
    phone: waId,
    avatar: name.slice(0, 2).toUpperCase(),
    type: 'individual',
    isImportant: false,
  });
}

// POST /api/webhook — Incoming messages from WhatsApp
router.post('/', verifyWebhookSignature, (req, res) => {
  const payload = req.body;
  if (payload.object !== 'whatsapp_business_account') {
    return res.status(404).json({ error: 'Not a WhatsApp event' });
  }

  // Respond immediately — Meta expects a fast 200; do the work after.
  res.status(200).json({ status: 'received' });

  payload.entry?.forEach(entry => {
    entry.changes?.forEach(change => {
      const value = change.value;
      value.messages?.forEach(async waMsg => {
        try {
          const contact = upsertContactFromWebhook(waMsg.from, value.contacts || []);
          const text = waMsg.text?.body || waMsg.button?.text || waMsg.interactive?.button_reply?.title || '';

          const classification = await classifyMessage({
            id: waMsg.id,
            direction: 'inbound',
            body: text,
            contactId: contact.id,
            contact,
          });

          const message = store.addMessage({
            id: waMsg.id,
            contactId: contact.id,
            direction: 'inbound',
            body: text,
            timestamp: new Date().toISOString(),
            status: 'unread',
            isImportant: classification.isImportant,
            priority: classification.priority,
            importanceReason: classification.reason,
            importanceSource: classification.source,
            tags: classification.tags,
          });

          console.log('[Webhook] Stored inbound message', waMsg.id, `(${classification.priority})`);
          bus.emit('message', { ...message, contact });
        } catch (err) {
          console.error('[Webhook] Failed to process message', waMsg.id, err.message);
        }
      });
    });
  });
});

module.exports = router;
