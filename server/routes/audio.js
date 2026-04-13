const express = require('express');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/audio/stream/:noteId
 * Streams TTS audio for a note's extracted text using edge-tts (free Microsoft TTS)
 */
router.get('/stream/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!note.extractedText || note.extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No extracted text available for this document. AI processing may still be in progress.' });
    }

    // Truncate text to prevent excessive TTS processing (max ~5000 chars for a reasonable audio)
    const maxChars = 5000;
    let text = note.extractedText.substring(0, maxChars);
    if (note.extractedText.length > maxChars) {
      text += '... This is a summarized version of the document. The full text contains more content.';
    }

    // Clean up text for better TTS output
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();

    // Set audio headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    const { EdgeTTS } = require('node-edge-tts');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const tts = new EdgeTTS({
      voice: 'en-US-AriaNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });

    const tempPath = path.join(os.tmpdir(), `tts-stream-${note._id}-${Date.now()}.mp3`);
    await tts.ttsPromise(text, tempPath);

    res.sendFile(tempPath, (err) => {
      try { fs.unlinkSync(tempPath); } catch (e) {}
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'TTS stream failed' });
      }
    });

  } catch (err) {
    console.error('Audio stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * GET /api/audio/generate/:noteId
 * Generates the full audio and returns it as a downloadable mp3
 */
router.get('/generate/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!note.extractedText || note.extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No extracted text available.' });
    }

    // Truncate for reasonable audio
    const maxChars = 5000;
    let text = note.extractedText.substring(0, maxChars);
    text = text.replace(/\n{3,}/g, '\n\n').replace(/[^\S\n]+/g, ' ').trim();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${note.slugId}-audio.mp3"`);

    const { EdgeTTS } = require('node-edge-tts');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const tts = new EdgeTTS({
      voice: 'en-US-AriaNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });

    const tempPath = path.join(os.tmpdir(), `tts-gen-${note._id}-${Date.now()}.mp3`);
    await tts.ttsPromise(text, tempPath);

    res.download(tempPath, `${note.slugId}-audio.mp3`, (err) => {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
