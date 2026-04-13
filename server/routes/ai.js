const express = require('express');
const Note = require('../models/Note');
const Embedding = require('../models/Embedding');
const Graph = require('../models/Graph');
const groq = require('../config/groq');
const { authenticate } = require('../middleware/auth');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

const router = express.Router();

// Lazy-load the embedding pipeline (heavy model, load once)
let embedPipeline = null;
async function getEmbedPipeline() {
  if (!embedPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedPipeline;
}

// Generate embedding for a text chunk
async function generateEmbedding(text) {
  const pipe = await getEmbedPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Cosine similarity for vector search fallback (free tier Atlas may not support $vectorSearch)
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * POST /api/ai/embed/:noteId
 * Triggers text extraction and embedding generation for a note.
 * Called as a background task after admin approval.
 */
// --- Sequential Task Queue Logic ---
const embedQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || embedQueue.length === 0) return;
  isProcessingQueue = true;

  while (embedQueue.length > 0) {
    const noteId = embedQueue.shift();
    console.log(`📡 Queue: Starting processing for note ${noteId} (${embedQueue.length} remaining)`);
    try {
      await performEmbedding(noteId);
    } catch (err) {
      console.error(`❌ Queue Error for note ${noteId}:`, err.message);
    }
  }

  isProcessingQueue = false;
  console.log('📡 Queue: All pending embedding tasks complete.');
}

/**
 * Public entry point for embedding. Adds note to queue.
 */
async function embedDocument(noteId) {
  if (!embedQueue.includes(noteId)) {
    embedQueue.push(noteId);
    console.log(`📡 Queue: Added note ${noteId} to embedding queue.`);
    processQueue();
  }
}

/**
 * The actual workhorse function (renamed from previous embedDocument)
 */
async function performEmbedding(noteId) {
  try {
    const note = await Note.findById(noteId);
    if (!note) throw new Error('Note not found');

    console.log(`📥 Stage 1/4: Downloading file for note ${note.title}...`);
    note.embeddingStatus = 'processing';
    await note.save();

    // Download the PDF
    const response = await fetch(note.fileUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Extract text
    console.log(`🔍 Stage 2/4: Extracting text from ${note.fileType}...`);
    let extractedText = '';
    if (note.fileType === 'pdf') {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else {
      extractedText = `[PPT Document: ${note.title}] Content extraction for PPT files is limited.`;
    }

    if (!extractedText.trim()) {
      note.embeddingStatus = 'failed';
      await note.save();
      console.error(`❌ No text extracted from note ${noteId}`);
      return;
    }

    note.extractedText = extractedText;
    await note.save();

    // Chunk the text
    console.log(`✂️ Stage 3/4: Chunking text for indexing...`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await splitter.splitText(extractedText);

    // Delete any existing embeddings for this note
    await Embedding.deleteMany({ noteId: note._id });

    // Generate embeddings for each chunk
    console.log(`🧠 Stage 4/4: Generating neural embeddings for ${chunks.length} chunks...`);
    for (let i = 0; i < chunks.length; i++) {
        // Log progress every 10 chunks to avoid spam but show activity
        if (i % 10 === 0) console.log(`   > Progress: ${i}/${chunks.length} chunks...`);
      const embedding = await generateEmbedding(chunks[i]);
      await Embedding.create({
        noteId: note._id,
        content: chunks[i],
        embedding,
        metadata: { chunkIndex: i, pageNumber: 0 },
      });
    }

    note.embeddingStatus = 'complete';
    await note.save();
    console.log(`✅ SUCCESS: AI mapping complete for "${note.title}"`);
  } catch (err) {
    console.error(`❌ FAILURE: Embedding failed for note ${noteId}:`, err.message);
    try {
      await Note.findByIdAndUpdate(noteId, { embeddingStatus: 'failed' });
    } catch (e) {
      // ignore
    }
    throw err; // Re-throw to be caught by processQueue
  }
}

// Manual trigger endpoint (admin can re-trigger)
router.post('/embed/:noteId', authenticate, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Fire and forget — don't block the response
    embedDocument(note._id.toString());

    res.json({ message: 'Embedding started', noteId: note._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/chat/:noteId
 * RAG Chat — streams AI responses using SSE
 */
router.post('/chat/:noteId', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.embeddingStatus !== 'complete') {
      return res.status(400).json({
        error: 'Document is not yet processed for AI chat. Please wait for embedding to complete.',
        embeddingStatus: note.embeddingStatus,
      });
    }

    // Generate embedding for the user's question
    const questionEmbedding = await generateEmbedding(message);

    // Retrieve all embeddings for this note and do cosine similarity search
    const allEmbeddings = await Embedding.find({ noteId: note._id }).lean();

    // Score and sort by similarity
    const scored = allEmbeddings.map(doc => ({
      content: doc.content,
      score: cosineSimilarity(questionEmbedding, doc.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Take top 5 most relevant chunks
    const topChunks = scored.slice(0, 5);
    const context = topChunks.map(c => c.content).join('\n\n---\n\n');

    // Build the prompt
    const systemPrompt = `You are Synapse AI, an intelligent document assistant for the Noteables platform. 
You help students understand their academic documents by answering questions based strictly on the provided context.

RULES:
- Answer ONLY based on the provided document context
- If the context doesn't contain enough information, say so clearly
- Use clear, concise language appropriate for college students
- Format your response with markdown when helpful (bold, lists, etc.)
- Cite specific parts of the text when possible
- Be encouraging and helpful`;

    const userPrompt = `DOCUMENT CONTEXT:
${context}

---

STUDENT'S QUESTION: ${message}

Please answer the question based strictly on the document context above.`;

    // Set up SSE streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Stream from Groq
    const chatStream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 1024,
    });

    for await (const chunk of chatStream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    // If headers already sent, end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * GET /api/ai/status/:noteId
 * Check embedding status for a note
 */
router.get('/status/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId).select('embeddingStatus');
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ embeddingStatus: note.embeddingStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/graph/generate/:noteId
 * Uses AI to extract nodes and links for a knowledge graph.
 */
router.post('/graph/generate/:noteId', authenticate, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (!note.extractedText) return res.status(400).json({ error: 'Note has no extracted text. Process it first.' });

    const systemPrompt = `You are a Knowledge Graph Architect. 
Your task is to analyze the provided text and extract a structured knowledge graph of key concepts and their relationships.

OUTPUT FORMAT:
Your final response MUST be a valid JSON object with the following structure:
{
  "nodes": [{ "id": "unique-id", "label": "Short Topic Name", "type": "concept|method|result|person" }],
  "links": [{ "source": "node-id-1", "target": "node-id-2", "relationship": "related to|part of|leads to" }]
}

RULES:
- Limit to top 15-20 most important nodes.
- Labels must be concise (1-3 words).
- All source/target IDs in 'links' MUST exist in 'nodes'.
- No preamble or markdown formatting, just raw JSON.`;

    const userPrompt = `TEXT TO ANALYZE:
${note.extractedText.slice(0, 10000)} // Limiting text to stay within context window`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const graphData = JSON.parse(completion.choices[0].message.content);

    // Validate and Clean
    const validNodeIds = new Set(graphData.nodes.map(n => n.id));
    graphData.links = graphData.links.filter(l => validNodeIds.has(l.source) && validNodeIds.has(l.target));

    // Save or update graph
    await Graph.findOneAndUpdate(
      { noteId: note._id },
      { 
        uploaderId: req.user.id,
        nodes: graphData.nodes.map(n => ({ ...n, val: 20 })), 
        links: graphData.links 
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Graph generated successfully', data: graphData });
  } catch (err) {
    console.error('Graph generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/graph/all
 * Fetches all graph data for the user to build the "Omni-Brain"
 */
router.get('/graph/all', authenticate, async (req, res) => {
  try {
    // For now, fetch all graphs for approved notes (social learning aspect)
    // Or filter by req.user.id if personal only
    const graphs = await Graph.find().lean();
    
    // Merge logic for Omni-Brain
    const globalNodes = [];
    const globalLinks = [];
    const nodeMap = new Map(); // label -> node

    graphs.forEach(g => {
      g.nodes.forEach(node => {
        const normalizedLabel = node.label.toLowerCase().trim();
        if (nodeMap.has(normalizedLabel)) {
          // Increase weight of existing node
          const existing = nodeMap.get(normalizedLabel);
          existing.val = (existing.val || 20) + 5;
        } else {
          const newNode = { ...node, originalId: node.id, id: `global-${node.id}-${Math.random().toString(36).substr(2, 5)}` };
          nodeMap.set(normalizedLabel, newNode);
          globalNodes.push(newNode);
        }
      });
    });

    // Remap links
    graphs.forEach(g => {
      g.links.forEach(link => {
        // Find the global ID for the source and target based on labels
        const sourceNode = g.nodes.find(n => n.id === link.source);
        const targetNode = g.nodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          const globalSource = nodeMap.get(sourceNode.label.toLowerCase().trim());
          const globalTarget = nodeMap.get(targetNode.label.toLowerCase().trim());
          
          if (globalSource && globalTarget) {
            globalLinks.push({
              source: globalSource.id,
              target: globalTarget.id,
              relationship: link.relationship
            });
          }
        }
      });
    });

    res.json({ nodes: globalNodes, links: globalLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/nexus/chat
 * General purpose AI Assistant (ChatGPT style) — streams via SSE
 */
router.post('/nexus/chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body; // Expects array of {role, content}
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemPrompt = `You are Nexus AI, a highly advanced, general-purpose AI assistant integrated into the Noteables platform. 
Your goal is to provide intelligent, accurate, and helpful assistance to students and researchers.

CAPABILITIES:
- Answer general questions across all academic subjects
- Write and debug code
- Help with creative writing and complex problem solving
- Explain difficult concepts in simple terms

TONE & STYLE:
- Professional, encouraging, and clear
- Use Markdown for code, lists, and bold text
- Be concise but thorough
- You are different from Synapse AI (which only knows about documents); YOU are a general knowledge powerhouse.`;

    // Set up SSE streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    });

    for await (const chunk of completion) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Nexus Chat error:', err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * Cleans up nodes stuck in 'processing' on server restart.
 */
async function recoverStuckNotes() {
  try {
    const result = await Note.updateMany(
      { embeddingStatus: 'processing' },
      { embeddingStatus: 'failed' } // Changed to failed so the user can easily retry via the UI
    );
    if (result.modifiedCount > 0) {
      console.log(`📡 Recovery: Reset ${result.modifiedCount} stuck embedding tasks to 'failed'.`);
    }
  } catch (err) {
    console.error('📡 Recovery Error:', err.message);
  }
}

// Export both the router and the embedDocument function (for admin.js to call)
module.exports = router;
module.exports.embedDocument = embedDocument;
module.exports.recoverStuckNotes = recoverStuckNotes;
