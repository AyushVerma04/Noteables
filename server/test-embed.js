const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Note = require('./models/Note');
const { embedDocument } = require('./routes/ai');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const note = await Note.findOne({ title: "Laravel" });
    if (note) {
        console.log(`Triggering processing for ${note.title}`);
        await embedDocument(note._id.toString());
    } else {
        console.log("Not found.");
    }
}
run();
