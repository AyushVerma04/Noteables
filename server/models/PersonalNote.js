const mongoose = require('mongoose');

const personalNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, default: 'Untitled Note' },
  content: { type: String, default: '' }, // HTML from TipTap — images are Supabase URLs, NOT base64
}, { timestamps: true });

// Compound index for fast user note queries
personalNoteSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('PersonalNote', personalNoteSchema);
