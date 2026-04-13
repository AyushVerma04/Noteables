require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('./models/Note');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await Note.updateMany(
        { status: 'approved', $or: [{ embeddingStatus: 'none' }, { embeddingStatus: { $exists: false } } ] },
        { embeddingStatus: 'failed' }
    );
    console.log(`Updated ${res.modifiedCount} approved notes to 'failed' status`);
    process.exit(0);
}
fix();
