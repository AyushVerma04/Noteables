import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPending();
  }, [user]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/pending');
      setNotes(data);
    } catch (err) {
      toast.error('Failed to load pending notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await API.patch(`/admin/notes/${id}`, { status });
      toast.success(`Note ${status} successfully`);
      setNotes(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      toast.error(`Failed to ${status} note`);
    }
  };

  const timeSince = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 4 }}>
        <h1>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', verticalAlign: 'middle', marginRight: 8 }}>
            admin_panel_settings
          </span>
          Admin Control Center
        </h1>
      </div>
      <p className="subtitle">
        Review, approve, or reject pending note submissions. Maintain the integrity of the knowledge archive.
      </p>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
          {notes.length} Pending Review
        </span>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner"></div>
        </div>
      ) : notes.length > 0 ? (
        <div className="admin-queue">
          {notes.map(note => (
            <div className="admin-note-row" key={note._id} id={`admin-note-${note._id}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                <span className="material-symbols-outlined" style={{
                  color: note.fileType === 'pdf' ? 'var(--primary-container)' : 'var(--tertiary-container)',
                  fontSize: 28,
                  flexShrink: 0,
                }}>
                  {note.fileType === 'pdf' ? 'picture_as_pdf' : 'slideshow'}
                </span>

                <div className="admin-note-info">
                  <h3>{note.title}</h3>
                  <div className="meta">
                    <span>by {note.uploaderId?.email?.split('@')[0] || 'Unknown'}</span>
                    <span>•</span>
                    <span>{timeSince(note.createdAt)}</span>
                    <span>•</span>
                    <span>Year {note.metadata.year} / Sem {note.metadata.semester}</span>
                    <span>•</span>
                    <span>{note.metadata.subject}</span>
                  </div>
                </div>
              </div>

              <div className="admin-note-actions">
                <span className={`badge badge-${note.fileType}`}>{note.fileType.toUpperCase()}</span>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleAction(note._id, 'approved')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleAction(note._id, 'rejected')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined">task_alt</span>
          <h3>All Clear</h3>
          <p>No pending submissions to review. The archive is up to date.</p>
        </div>
      )}
    </div>
  );
}
