const mongoose = require('mongoose');
const Note = require('./models/Note');
const dotenv = require('dotenv');

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const notes = await Note.find();
    console.log("Total notes:", notes.length);
    for(const n of notes) {
        console.log(`Note: ${n.title}, Status: ${n.status}, EmbeddingStatus: ${n.embeddingStatus}`);
    }
    process.exit(0);
}
check();
