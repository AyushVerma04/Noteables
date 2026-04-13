require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const notesRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const audioRoutes = require('./routes/audio');
const flashcardRoutes = require('./routes/flashcard');
const workspaceRoutes = require('./routes/workspace');
const { recoverStuckNotes } = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for TipTap HTML content

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/ai/flashcards', flashcardRoutes);
app.use('/api/workspace', workspaceRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🔥 Noteables API running on port ${PORT}`);
    recoverStuckNotes();
  });
});
// Restart trigger
