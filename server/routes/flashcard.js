const express = require('express');
const Note = require('../models/Note');
const groq = require('../config/groq');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/ai/flashcards/:noteId
 * Generates 10 Q&A flashcards from the document's extracted text using Groq
 */
router.post('/:noteId', authenticate, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!note.extractedText || note.extractedText.trim().length === 0) {
      return res.status(400).json({
        error: 'No extracted text available. The document may still be processing.',
      });
    }

    // Truncate text context for the prompt (max ~4000 chars to stay within token limits)
    const contextText = note.extractedText.substring(0, 4000);

    const prompt = `You are an expert academic tutor. Analyze the following document text and generate exactly 10 highly conceptual flashcard Q&A pairs.

DOCUMENT TEXT:
${contextText}

INSTRUCTIONS:
- Create questions that test UNDERSTANDING, not just memorization
- Include a mix of: conceptual, application, and analysis questions
- Make answers concise but comprehensive (2-4 sentences max)
- Output ONLY a valid JSON array, no other text
- Each object must have exactly "question" and "answer" fields

OUTPUT FORMAT (strict JSON):
[
  {"question": "What is...", "answer": "It is..."},
  {"question": "How does...", "answer": "It works by..."}
]

Generate exactly 10 flashcards now:`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an academic flashcard generator. You output ONLY valid JSON arrays. No markdown, no code fences, no explanations — just the raw JSON array.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Parse the JSON response (handle potential markdown code fences)
    let flashcards;
    try {
      // Try to extract JSON from the response (might be wrapped in code fences)
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      flashcards = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Flashcard parse error:', parseErr.message, 'Raw:', rawResponse.substring(0, 200));
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Validate structure
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(500).json({ error: 'AI returned invalid flashcard format.' });
    }

    // Ensure each card has question and answer
    flashcards = flashcards
      .filter(card => card.question && card.answer)
      .slice(0, 10);

    res.json({
      noteId: note._id,
      noteTitle: note.title,
      flashcards,
      count: flashcards.length,
    });
  } catch (err) {
    console.error('Flashcard generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
