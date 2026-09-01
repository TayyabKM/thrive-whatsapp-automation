const express = require('express');
const router = express.Router();
const whatsapp = require('../adapters/whatsapp');

// GET /api/summary
router.get('/', async (req, res) => {
  try {
    const summary = await whatsapp.getSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
