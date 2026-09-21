const express = require('express');
const router = express.Router();
const bus = require('../services/bus');

// GET /api/events — Server-Sent Events stream. Pushes a 'message' event the
// moment the webhook stores a new inbound message or a reply is sent.
router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('retry: 3000\n\n');

  const onMessage = (msg) => {
    res.write(`event: message\ndata: ${JSON.stringify(msg)}\n\n`);
  };
  bus.on('message', onMessage);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    bus.off('message', onMessage);
  });
});

module.exports = router;
