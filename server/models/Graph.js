const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nodes: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: 'concept' },
    val: { type: Number, default: 20 } // For node size
  }],
  links: [{
    source: { type: String, required: true },
    target: { type: String, required: true },
    relationship: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Graph', graphSchema);
