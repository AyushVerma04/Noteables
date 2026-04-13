const express = require('express');
const { nanoid } = require('nanoid');
const PersonalNote = require('../models/PersonalNote');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/workspace — list all personal notes for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const notes = await PersonalNote.find({ userId: req.user._id })
      .select('title content updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Return notes with a preview (first 120 chars of stripped HTML)
    const result = notes.map(note => ({
      ...note,
      preview: note.content
        ? note.content.replace(/<[^>]*>/g, '').substring(0, 120)
        : '',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspace/:id — get a single personal note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await PersonalNote.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspace — create a new personal note
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await PersonalNote.create({
      userId: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workspace/:id — update a personal note
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await PersonalNote.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, content },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workspace/:id — delete a personal note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await PersonalNote.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/workspace/upload-image
 * Generate a presigned URL for workspace image uploads
 * This is the critical pipeline for TipTap image paste interception:
 * Browser intercepts base64 → sends to this endpoint → gets Supabase URL → inserts URL in editor
 */
router.post('/upload-image', authenticate, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });

    const ext = fileName.split('.').pop().toLowerCase();
    const safeName = `workspace/${req.user._id}/${nanoid(10)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUploadUrl(safeName);

    if (error) return res.status(500).json({ error: `Supabase error: ${error.message}` });

    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(safeName);

    res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: publicData.publicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
