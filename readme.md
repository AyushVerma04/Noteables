# Noteables - The AI-Powered College Notes Platform

Noteables is a comprehensive, AI-enhanced knowledge management system specifically designed for college students and professionals. It provides a rich text workspace (the "Personal Workspace"), advanced RAG (Retrieval-Augmented Generation) AI functionalities (Nexus AI), dynamic studying mechanisms (Flashcard Engine, Podcast Studio), and an interactive 3D Knowledge Graph (Omni-Brain).

The platform's UI follows the **"Kinetic Alchemist"** design system, creating a highly polished, interactive, dark-mode-first aesthetic with deep glassmorphism and smooth micro-animations.

## 🌟 Key Features

- **Nexus AI Assistant**: Chat with your documents using Groq LLMs and Local Embeddings via a high-performance RAG pipeline.
- **Omni-Brain Knowledge Graph**: Visualize the connections between logic, concepts, and notes across your entire repository in an interactive 3D space.
- **Rich Text Workspace**: A robust, Notion-like editor utilizing TipTap with seamless Supabase-backed image uploading and code syntax highlighting.
- **Podcast Studio (TTS)**: Stream summaries, notes, and concepts to audio using advanced Text-to-Speech integration.
- **Flashcard Engine**: Automatically generate and study flashcards based on the material in your workspace via AI extraction.
- **Granular Access Control**: Role-Based Access Control (RBAC) separating student access from a dedicated Admin Dashboard for global oversight.

---

## 🏛️ Architecture & Tech Stack

Noteables uses a decoupled Node.js Backend and React Frontend architecture, optimizing for robust document handling and inference latency.

### Frontend (Client)
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM (v7)
- **Editor**: TipTap (Headless WYSIWYG based on ProseMirror)
- **3D Visualization**: `react-force-graph-3d` & `three.js` designed for mapping concept relations.
- **Icons & Styling**: Lucide React, React Icons, and Custom Vanilla CSS built purely around the distinct Kinetic Alchemist aesthetic.
- **State Management & Notifications**: React Hooks & React Hot Toast

### Backend (Server)
- **Runtime**: Node.js + Express
- **Database (Primary DB)**: MongoDB Atlas (via Mongoose) for user state, notes metadata, and platform relationships.
- **Database (Vector/Blob)**: Supabase (PostgreSQL pgvector, Storage Buckets) for high-performance vector retrieval and asset storage.
- **Authentication**: Custom JWT (JSON Web Tokens) & `bcryptjs`
- **AI/ML Pipeline**: 
  - LangChain for RAG orchestration and data ingestion formatting.
  - `@xenova/transformers` for generating document embeddings completely locally via Transformers.js.
  - Groq SDK (`@langchain/groq`) for ultra-fast language model inference.
  - `node-edge-tts` for real-time Text-to-Speech audio streaming.
- **File Parsing**: `pdf-parse` for semantic document extraction.

---

## 🧠 System Workflow (The AI Pipeline)

1. **Document Ingestion**: Users write notes in the TipTap rich text workspace or upload documents.
2. **Vector Embedding Processing**: The Node backend receives the text, chunks it using Langchain's `TextSplitters`, runs it through a local Transformer model to generate vector embeddings, and instantly syncs these vectors into Supabase's `pgvector` database. 
3. **Retrieval-Augmented Generation (RAG)**: When a user requests help from Nexus AI, the backend embeds the user's query, searches Supabase for semantic text chunks matching the query, and feeds both the context and prompt to Groq for sub-second, highly contextual responses.
4. **Data Visualization**: Omni-Brain continuously maps metadata and semantic links via MongoDB, requesting graphical relationship data from the backend to render the 3D force-directed graph on the client.

---

## 🚀 Setting Up the Project Locally

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18+)
- Active MongoDB Atlas cluster
- Active Supabase project
- Groq API Key

### 1. Clone the repository
```bash
git clone https://github.com/AyushVerma04/Noteables.git
cd Noteables
```

### 2. Environment Variables Setup
You will need to configure `.env` files within both the `client` and `server` directories.

**Create `.env` inside `/server`**:
```env
PORT=5000
MONGODB_URI=your_mongodb_cluster_uri
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

**Create `.env` inside `/client`**:
```env
VITE_API_URL=http://localhost:5000
```
*(Check your client API instances to confirm the exact `VITE_` variable name needed).*

### 3. Start the Server
Navigate to the `server` directory, install dependencies, and start the development server.
```bash
cd server
npm install
npm run dev
```

### 4. Start the Client
Open a new terminal session, navigate to the `client` directory, install dependencies, and start Vite.
```bash
cd client
npm install
npm run dev
```
The frontend should now be successfully running on `http://localhost:5173`.

---

## 📁 Repository Structure
```
Noteables/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components & Kinetic Alchemist Shell
│   │   ├── pages/          # Full page views (Workspace, Chat, Admin, etc.)
│   │   ├── context/        # React context providers (Auth)
│   │   ├── assets/         # Static assets and global styling
│   │   └── App.jsx         # App Entry & Routing
│   ├── index.html
│   └── package.json
└── server/                 # Node.js Express Backend
    ├── models/             # Mongoose schemas (User, Document, etc.)
    ├── routes/             # Protected and public Express API endpoints
    ├── controllers/        # Request handling logic
    ├── services/           # External business logic (Langchain, TTS, Supabase connection)
    ├── index.js            # Express server configuration
    └── package.json
```

## 🛡️ Security / Deployment Notes
- This project leverages `.gitignore` locally to protect sensitive environment configurations. 
- Deployment is configured for platforms supporting decoupled hosting (e.g. Render/Railway for the server and Vercel/Netlify for the Vite app).
- Admin-related routes heavily rely on verified JWTs determining backend Role-Based Access Control logic.
