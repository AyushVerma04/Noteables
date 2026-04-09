const express = require('express');
const slugify = require('slugify');
const { nanoid } = require('nanoid');
const supabase = require('../config/supabase');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/upload/generate-url
router.post('/generate-url', authenticate, async (req, res) => {
  try {
    const { title, fileType, year, semester, subject, teacher, unit, fileName } = req.body;

    if (!title || !fileType || !year || !semester || !subject || !teacher || !unit || !fileName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['pdf', 'ppt'].includes(fileType)) {
      return res.status(400).json({ error: 'File type must be pdf or ppt' });
    }

    // Generate compound slug
    const slugBase = slugify(
      `year${year}-sem${semester}-${subject}-${teacher}-unit${unit}`,
      { lower: true, strict: true }
    );
    const slugId = `${slugBase}-${nanoid(6)}`;

    // Generate presigned upload URL from Supabase
    const filePath = `uploads/${slugId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUploadUrl(filePath);

    if (error) {
      return res.status(500).json({ error: `Supabase error: ${error.message}` });
    }

    // Get public URL for the file
    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    // Save note metadata to MongoDB as pending
    const note = await Note.create({
      title,
      fileUrl: publicData.publicUrl,
      fileType,
      status: 'pending',
      uploaderId: req.user._id,
      slugId,
      metadata: { year, semester, subject, teacher, unit },
    });

    res.status(201).json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      publicUrl: publicData.publicUrl,
      note: {
        id: note._id,
        slugId: note.slugId,
        status: note.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
