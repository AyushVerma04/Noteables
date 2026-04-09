const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  fileType: { type: String, enum: ['pdf', 'ppt'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slugId: { type: String, unique: true, required: true },
  metadata: {
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    subject: { type: String, required: true },
    teacher: { type: String, required: true },
    unit: { type: Number, required: true },
  },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
