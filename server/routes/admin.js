const express = require('express');
const Note = require('../models/Note');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/pending — list pending notes
router.get('/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const notes = await Note.find({ status: 'pending' })
      .populate('uploaderId', 'email')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/notes/:id — approve or reject
router.patch('/notes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('uploaderId', 'email');

    if (!note) return res.status(404).json({ error: 'Note not found' });

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
