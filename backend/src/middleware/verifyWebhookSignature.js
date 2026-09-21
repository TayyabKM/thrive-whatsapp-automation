const crypto = require('crypto');

/**
 * Verifies Meta's X-Hub-Signature-256 header on inbound webhook POSTs, so a
 * request can't inject fake messages without knowing WHATSAPP_APP_SECRET.
 * Needs the raw request body (see express.json({ verify }) in index.js) since
 * the signature is computed over the exact bytes Meta sent, not the parsed JSON.
 * Set WHATSAPP_APP_SECRET in backend/.env to enable; leave unset to keep the
 * webhook open (local dev without a Meta app secret yet).
 */
function verifyWebhookSignature(req, res, next) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return next();

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !req.rawBody) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  next();
}

module.exports = verifyWebhookSignature;
