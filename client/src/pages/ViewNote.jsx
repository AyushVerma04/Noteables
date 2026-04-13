import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FlashcardModal from '../components/FlashcardModal';

export default function ViewNote() {
  const { slugId } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Phase 2 AI States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: '👋 Hi! I am the Synapse AI Assistant. Ask me anything about this document.' }
  ]);
  const [chatting, setChatting] = useState(false);
  const messagesEndRef = useRef(null);
  const [embeddingStatus, setEmbeddingStatus] = useState('none');

  // Audio & Flashcards
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [showFlashcards, setShowFlashcards] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [slugId]);

  useEffect(() => {
    // Poll embedding status if processing
    let interval;
    if (note && note.embeddingStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const { data } = await API.get(`/ai/status/${note._id}`);
          setEmbeddingStatus(data.embeddingStatus);
          setNote(prev => ({ ...prev, embeddingStatus: data.embeddingStatus }));
          if (data.embeddingStatus !== 'processing') {
            clearInterval(interval);
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [note]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/notes/${slugId}`);
      setNote(data);
      setEmbeddingStatus(data.embeddingStatus);
    } catch (err) {
      toast.error('Note not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type) => {
    if (!user) return toast.error('Please login to vote');
    try {
      const { data } = await API.post(`/notes/${note._id}/vote`, { type });
      setNote(prev => ({
        ...prev,
        upvoteCount: data.upvoteCount,
        downvoteCount: data.downvoteCount,
        upvotes: type === 'up'
          ? (prev.upvotes.includes(user._id || user.id)
              ? prev.upvotes.filter(id => id !== (user._id || user.id))
              : [...prev.upvotes.filter(id => id !== (user._id || user.id)), (user._id || user.id)])
          : prev.upvotes.filter(id => id !== (user._id || user.id)),
        downvotes: type === 'down'
          ? (prev.downvotes.includes(user._id || user.id)
              ? prev.downvotes.filter(id => id !== (user._id || user.id))
              : [...prev.downvotes.filter(id => id !== (user._id || user.id)), (user._id || user.id)])
          : prev.downvotes.filter(id => id !== (user._id || user.id)),
      }));
    } catch (err) {
      toast.error('Vote failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to comment');
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(`/notes/${note._id}/comments`, { text: commentText });
      setNote(prev => ({ ...prev, comments: data }));
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Phase 2: RAG Chat Submit
  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatting) return;
    if (embeddingStatus !== 'complete') {
      return toast.error('Document AI processing is not complete yet.');
    }

    const question = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: question }, { role: 'ai', content: '' }]);
    setChatting(true);

    try {
      const token = localStorage.getItem('noteables_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat/${note._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: question })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Chat sync failed' }));
        throw new Error(errorData.error);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                toast.error(data.error);
              } else if (data.content !== undefined) {
                setChatMessages(prev => {
                  const newMsgs = [...prev];
                  const lastIdx = newMsgs.length - 1;
                  newMsgs[lastIdx] = {
                    ...newMsgs[lastIdx],
                    content: newMsgs[lastIdx].content + data.content
                  };
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error('SSE JSON parse error', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error(error.message);
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = 'Sorry, an error occurred while connecting to the AI.';
        return newMsgs;
      });
    } finally {
      setChatting(false);
    }
  };

  // Phase 2: Audio handling
  const toggleAudio = () => {
    if (!audioRef.current) {
      if (embeddingStatus !== 'complete') {
        return toast.error('Document must be processed by AI first.');
      }
      const token = localStorage.getItem('noteables_token');
      // Set audio source to the streaming endpoint
      // Using fetch wouldn't easily populate standard <audio>, so we pass token normally in cookies or just URL?
      // For a secure audio tag, we can hit an endpoint that generates a secure single-use URL, 
      // or we can use Blob if we fetch. Given EdgeTTS streams perfectly, let's fetch as blob if needed, 
      // OR for simplicity in MVP, we just expose the streaming endpoint if the backend allows GET without strict auth,
      // but assuming it needs auth, we'll fetch into a MediaSource or just Blob:
      toast.loading('Buffering audio stream...', { id: 'audio-toast' });
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/audio/stream/${note._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Audio generation failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setAudioPlaying(false);
        audio.play();
        setAudioPlaying(true);
        toast.success('Audio ready', { id: 'audio-toast' });
      })
      .catch(err => toast.error(err.message, { id: 'audio-toast' }));
    } else {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play();
        setAudioPlaying(true);
      }
    }
  };

  // Phase 2: Flashcards
  const handleGenerateFlashcards = async () => {
    if (embeddingStatus !== 'complete') {
      return toast.error('Document must be processed by AI first.');
    }
    setIsGeneratingFlashcards(true);
    const tid = toast.loading('Synapse AI is generating your quiz... (takes ~15s)');
    try {
      const { data } = await API.post(`/ai/flashcards/${note._id}`);
      setFlashcards(data.flashcards);
      setShowFlashcards(true);
      toast.success('Flashcards ready!', { id: tid });
    } catch (err) {
      toast.error('AI could not generate flashcards. Please try again.', { id: tid });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleRetryEmbedding = async () => {
    try {
      setEmbeddingStatus('processing');
      await API.post(`/ai/embed/${note._id}`);
      toast.success('AI processing restarted');
    } catch (err) {
      setEmbeddingStatus('failed');
      toast.error('Failed to restart AI processing');
    }
  };

  const getViewerUrl = () => {
    if (!note) return '';
    if (note.fileType === 'pdf') return note.fileUrl;
    return `https://docs.google.com/gview?url=${encodeURIComponent(note.fileUrl)}&embedded=true`;
  };

  const userId = user?._id || user?.id;
  const hasUpvoted = note?.upvotes?.some(id => id === userId || id?.toString() === userId);
  const hasDownvoted = note?.downvotes?.some(id => id === userId || id?.toString() === userId);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="empty-state" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="material-symbols-outlined">error_outline</span>
        <h3>Note Not Found</h3>
        <p>The requested document could not be located in the archive.</p>
      </div>
    );
  }

  return (
    <div className="viewer-layout">
      {/* Main Content */}
      <div className="viewer-main">
        {/* Header */}
        <div className="viewer-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 className="viewer-title">{note.title}</h1>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleGenerateFlashcards}
              disabled={isGeneratingFlashcards || embeddingStatus !== 'complete'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>style</span>
              {isGeneratingFlashcards ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>

          <div className="viewer-tags">
            {embeddingStatus === 'complete' && <span className="badge badge-primary">AI Ready</span>}
            {embeddingStatus === 'processing' && <span className="badge badge-pending">AI Processing...</span>}
            {embeddingStatus === 'failed' && (
              <button className="badge badge-failed" onClick={handleRetryEmbedding} title="Click to retry AI mapping">
                AI Failed (Retry?)
              </button>
            )}
            <span className={`badge badge-${note.fileType}`}>{note.fileType.toUpperCase()}</span>
          </div>

          <div className="viewer-meta">
            <span>Year {note.metadata.year}</span>
            <span>Semester {note.metadata.semester}</span>
            <span>{note.metadata.subject}</span>
            <span>{note.metadata.teacher}</span>
            <span>Unit {note.metadata.unit}</span>
          </div>
        </div>

        {/* Audio Player */}
        <div className="audio-player-stub">
          <div className="audio-wave">
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
            <span style={{ animationPlayState: audioPlaying ? 'running' : 'paused' }}></span>
          </div>
          <div className="audio-info">
            <h4>Podcast Audio</h4>
            <p>{audioPlaying ? 'Playing AI-generated summary' : 'AI-generated audio summary of this document'}</p>
          </div>
          <button
            className={`btn btn-sm ${audioPlaying ? 'btn-secondary' : 'btn-ai'}`}
            onClick={toggleAudio}
            disabled={embeddingStatus !== 'complete' && embeddingStatus !== 'processing' && embeddingStatus !== 'failed'} // Let backend reject if no text, but broadly allow if not 'none'
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {audioPlaying ? 'pause' : 'spatial_audio_off'}
            </span>
            {audioPlaying ? 'Pause' : (audioRef.current ? 'Play Audio' : 'Generate Audio')}
          </button>
        </div>

        {/* Document Viewer */}
        <div className="document-embed">
          {note.fileType === 'pdf' ? (
            <object
              data={note.fileUrl}
              type="application/pdf"
              style={{ width: '100%', minHeight: 600 }}
            >
              <p style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                Unable to display PDF. 
                <a href={note.fileUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                  Download instead
                </a>
              </p>
            </object>
          ) : (
            <iframe
              src={getViewerUrl()}
              style={{ width: '100%', minHeight: 600 }}
              title="Document Viewer"
              allowFullScreen
            />
          )}
        </div>

        {/* Vote Section */}
        <div className="vote-section">
          <button
            className={`vote-btn ${hasUpvoted ? 'active-up' : ''}`}
            onClick={() => handleVote('up')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
            {note.upvoteCount || 0}
          </button>
          <button
            className={`vote-btn ${hasDownvoted ? 'active-down' : ''}`}
            onClick={() => handleVote('down')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_down</span>
            {note.downvoteCount || 0}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="viewer-sidebar">
        {/* RAG Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className={`synapse-orb ${chatting ? 'active' : ''}`}></div>
            <h3>Synapse AI</h3>
            <span className={`badge ${embeddingStatus === 'complete' ? 'badge-primary' : 'badge-pending'}`} style={{ fontSize: '0.6rem' }}>
              {embeddingStatus === 'complete' ? 'Ready' : 'Processing...'}
            </span>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div className={`chat-msg ${msg.role}`} key={i}>
                {msg.content}
                {msg.role === 'ai' && chatting && i === chatMessages.length - 1 && msg.content === '' && (
                  <span className="text-variant">Thinking...</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleChat}>
            <input
              type="text"
              placeholder={
                embeddingStatus === 'complete' ? "Ask about this document..." : 
                embeddingStatus === 'processing' ? "Document processing..." :
                "AI Processing incomplete."
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatting || embeddingStatus !== 'complete'}
            />
            <button type="submit" disabled={chatting || !chatInput.trim() || embeddingStatus !== 'complete'}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {chatting ? 'stop_circle' : 'send'}
              </span>
            </button>
          </form>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat_bubble</span>
            Comments ({note.comments?.length || 0})
          </h3>

          <div className="comment-list">
            {note.comments?.length > 0 ? (
              note.comments.map((c, i) => (
                <div className="comment" key={i}>
                  <div className="comment-avatar">
                    {(c.userId?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="author">{c.userId?.email?.split('@')[0] || 'Anonymous'}</div>
                    <div className="text">{c.text}</div>
                    <div className="time">{new Date(c.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--outline)', textAlign: 'center', padding: 'var(--space-md) 0' }}>
                No comments yet. Be the first to discuss!
              </p>
            )}
          </div>

          <form className="comment-input" onSubmit={handleComment}>
            <input
              type="text"
              placeholder={user ? 'Add a comment...' : 'Login to comment'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!user || submitting}
              id="comment-input"
            />
            <button type="submit" disabled={!user || submitting} id="comment-submit">
              Post
            </button>
          </form>
        </div>
      </div>
      
      {/* Flashcard Modal overlay */}
      {showFlashcards && (
        <FlashcardModal 
          isOpen={showFlashcards} 
          onClose={() => setShowFlashcards(false)} 
          flashcards={flashcards} 
        />
      )}
    </div>
  );
}
