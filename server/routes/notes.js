const express = require('express');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notes — list approved notes with optional filters
router.get('/', async (req, res) => {
  try {
    const { year, semester, subject, search } = req.query;
    const filter = { status: 'approved' };

    if (year) filter['metadata.year'] = Number(year);
    if (semester) filter['metadata.semester'] = Number(semester);
    if (subject) filter['metadata.subject'] = { $regex: subject, $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'metadata.subject': { $regex: search, $options: 'i' } },
        { 'metadata.teacher': { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(filter)
      .populate('uploaderId', 'email reputationPoints')
      .sort({ createdAt: -1 })
      .lean();

    const result = notes.map(n => ({
      ...n,
      upvoteCount: n.upvotes.length,
      downvoteCount: n.downvotes.length,
      commentCount: n.comments.length,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:slugId — get single note by slug
router.get('/:slugId', async (req, res) => {
  try {
    const note = await Note.findOne({ slugId: req.params.slugId })
      .populate('uploaderId', 'email reputationPoints')
      .populate('comments.userId', 'email');

    if (!note) return res.status(404).json({ error: 'Note not found' });

    res.json({
      ...note.toObject(),
      upvoteCount: note.upvotes.length,
      downvoteCount: note.downvotes.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/:id/vote — toggle upvote/downvote
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const userId = req.user._id;

    if (type === 'up') {
      // Remove from downvotes if present
      note.downvotes = note.downvotes.filter(id => id.toString() !== userId.toString());
      // Toggle upvote
      const idx = note.upvotes.findIndex(id => id.toString() === userId.toString());
      if (idx > -1) {
        note.upvotes.splice(idx, 1);
      } else {
        note.upvotes.push(userId);
      }
    } else if (type === 'down') {
      // Remove from upvotes if present
      note.upvotes = note.upvotes.filter(id => id.toString() !== userId.toString());
      // Toggle downvote
      const idx = note.downvotes.findIndex(id => id.toString() === userId.toString());
      if (idx > -1) {
        note.downvotes.splice(idx, 1);
      } else {
        note.downvotes.push(userId);
      }
    }

    await note.save();
    res.json({ upvoteCount: note.upvotes.length, downvoteCount: note.downvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/:id/comments — add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    note.comments.push({ userId: req.user._id, text });
    await note.save();

    // Return the populated comment
    const updated = await Note.findById(req.params.id).populate('comments.userId', 'email');
    res.status(201).json(updated.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id/comments — list comments
router.get('/:id/comments', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('comments.userId', 'email');
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
