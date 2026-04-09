# Noteables - Phase 1 MVP Specification (Production-Grade Architecture)

## Context for AI Agent
You are an expert Senior Full-Stack Engineer. Your task is to build Phase 1 of "Noteables," a secure, admin-controlled document management system for college students. 

**CRITICAL DIRECTIVE:** The user is providing UI inspiration via Stitch MCP server. Use this inspiration to build the frontend, but you MUST adapt it to be fully mobile-responsive. 
Do NOT implement actual AI, RAG, or OCR logic in this phase. Focus strictly on working Role-Based Access Control (RBAC), secure file handling, and a flawless responsive UI.

## ⚠️ STRICT SDE-LEVEL CONSTRAINTS

1. **Presigned URL Uploads ONLY (Supabase):** - NEVER upload files through the Express server disk/memory. 
   - Use `@supabase/supabase-js` (`supabase.storage.from('bucket_name').createSignedUploadUrl()`) on the Node backend using the Service Role Key.
   - React requests the ticket, PUTs the file directly to Supabase, and Node saves the final public URL in MongoDB.
2. **Mobile-First Responsiveness & UI Polish:**
   - The UI must be fully responsive (mobile, tablet, desktop) using modern CSS/Tailwind. 
   - Implement Skeleton Loaders for data fetching and Toast notifications for all success/error states.
3. **In-App Viewing:** - PDFs: Use `react-pdf` or `<object>`. 
   - PPTs: Route the Supabase URL through the Google Docs Viewer iframe (`https://docs.google.com/gview?url={YOUR_SUPABASE_URL}&embedded=true`).
4. **Compound Slugs:** - Documents must use generated slugs for routing/searching (e.g., `year2-sem3-math-smith-unit1-xyz123`).

## 🔮 FORWARD-COMPATIBILITY (Hardcoded UI Stubs)
You must build the UI layout to accommodate Phase 2 AI features, but hardcode the data for now. 
When building the `/view/:slugId` Document Viewer, include:
- **"Chat with Notes" Sidebar:** A visually complete chat interface panel (input box, send button, fake AI messages) that is currently inert.
- **Podcast/Audio Player:** A modern audio player UI component at the top of the notes with a "Generate Audio" button that currently just shows a "Coming in Phase 2" toast notification.
- **OCR Tag Pills:** A section under the title displaying hardcoded tags like `[AI Generated]`, `[Handwritten]`, `[Scanned]`.

## Core Schema Requirements (MongoDB)

**User Schema:** `email`, `passwordHash` (bcrypt), `role` (Enum: "student", "admin"), `reputationPoints`.
**Note Schema:**
- `title`, `fileUrl` (Supabase Public URL), `fileType` ("pdf", "ppt"), `status` ("pending", "approved", "rejected"), `uploaderId` (Ref to User), `slugId`.
- `metadata`: { `year`, `semester`, `subject`, `teacher`, `unit` }
- `upvotes`, `downvotes` (Arrays of User IDs), `comments`: [{ `userId`, `text`, `timestamp` }]

## Execution Plan (Awaiting Approval per Step)

### Step 1: Foundation & Auth
- Initialize Vite React app and Node.js Express server.
- Set up responsive persistent navigation (Login, Register, Mobile Hamburger Menu).
- Implement JWT Auth. Admin panel link should only appear for Admin roles.

### Step 2: The Upload Pipeline & Admin Queue
- Build the `/api/upload/generate-url` Supabase endpoint.
- **Student View:** Responsive upload form with dependent dropdowns (Year -> Semester -> Subject). Uploads save to MongoDB as `status: "pending"`.
- **Admin View:** A dashboard table to review, approve, or reject pending uploads.

### Step 3: Discovery & Search
- Build the responsive homepage. Include dependent dropdown filters.
- Query MongoDB for `status: "approved"` notes matching filters.
- Display results in responsive cards showing title, metadata, and upvotes.

### Step 4: The Document Viewer & Social Features
- Create `/view/:slugId`.
- **Desktop Layout:** Document viewer left/center, Chat UI stub and Comments on the right.
- **Mobile Layout:** Stacked view (Document -> Chat Stub -> Comments).
- Implement working API routes for Upvote/Downvote and Comments.