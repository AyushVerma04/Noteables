const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: {
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Index for vector search (the Atlas Vector Search index must be created in Atlas UI)
embeddingSchema.index({ noteId: 1, 'metadata.chunkIndex': 1 });

module.exports = mongoose.model('Embedding', embeddingSchema);
