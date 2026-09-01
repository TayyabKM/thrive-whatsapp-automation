const express = require('express');
const router = express.Router();
const whatsapp = require('../adapters/whatsapp');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const stats = await whatsapp.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
