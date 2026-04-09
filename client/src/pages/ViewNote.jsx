import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ViewNote() {
  const { slugId } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [slugId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/notes/${slugId}`);
      setNote(data);
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
          <h1 className="viewer-title">{note.title}</h1>

          {/* OCR Tag Pills (Hardcoded Phase 2 Stub) */}
          <div className="viewer-tags">
            <span className="badge badge-secondary">AI Generated</span>
            <span className="badge badge-tertiary">Handwritten</span>
            <span className="badge badge-primary">Scanned</span>
          </div>

          <div className="viewer-meta">
            <span>Year {note.metadata.year}</span>
            <span>Semester {note.metadata.semester}</span>
            <span>{note.metadata.subject}</span>
            <span>{note.metadata.teacher}</span>
            <span>Unit {note.metadata.unit}</span>
          </div>
        </div>

        {/* Audio Player Stub */}
        <div className="audio-player-stub">
          <div className="audio-wave">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="audio-info">
            <h4>Podcast Audio</h4>
            <p>AI-generated audio summary of this document</p>
          </div>
          <button
            className="btn btn-ai btn-sm"
            onClick={() => toast('🔮 Text-to-Audio coming in Phase 2!', { icon: '🎙️' })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>spatial_audio_off</span>
            Generate Audio
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
        {/* Chat with Notes Stub (Phase 2) */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className="synapse-orb"></div>
            <h3>Chat with Notes</h3>
            <span className="badge badge-secondary" style={{ fontSize: '0.6rem' }}>Phase 2</span>
          </div>

          <div className="chat-messages">
            <div className="chat-msg ai">
              👋 Hi! I'm the Synapse AI Assistant. In Phase 2, I'll be able to answer questions about this document in real-time.
            </div>
            <div className="chat-msg user">
              What are the key concepts covered?
            </div>
            <div className="chat-msg ai">
              Great question! Once activated, I'll analyze the full document and provide contextual, cited answers from the content.
            </div>
            <div className="chat-msg ai">
              For now, try the comments section below to discuss with other students! 💬
            </div>
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask about this document..."
              onClick={() => toast('🔮 Chat with Notes coming in Phase 2!', { icon: '🧠' })}
              readOnly
            />
            <button onClick={() => toast('🔮 Chat with Notes coming in Phase 2!', { icon: '🧠' })}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
            </button>
          </div>
        </div>

        {/* Comments Section (Working) */}
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
    </div>
  );
}
