import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export default function SourceManager({ isOpen, onClose, onRefreshGraph }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingIds, setSyncingIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchApprovedNotes();
    }
  }, [isOpen]);

  const fetchApprovedNotes = async () => {
    setLoading(true);
    try {
      // Get all approved notes
      const res = await axios.get('/notes');
      setNotes(res.data || []);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (note) => {
    if (note.embeddingStatus !== 'complete') {
      return toast.error('Note must be processed by AI first (check embedding status).');
    }

    setSyncingIds(prev => new Set(prev).add(note._id));
    const tid = toast.loading(`Synapse AI is mapping: ${note.title}...`, { duration: Infinity });
    
    try {
      const res = await axios.post(`/ai/graph/generate/${note._id}`);
      toast.success(`Semantic topics from "${note.title}" added to Brain!`, { id: tid });
      onRefreshGraph(); // Refresh the 3D graph view
    } catch (err) {
      toast.error(`Mapping failed for ${note.title}`, { id: tid });
    } finally {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(note._id);
        return next;
      });
    }
  };

  const handleRetry = async (noteId) => {
    try {
      await axios.post(`/ai/embed/${noteId}`);
      toast.success('AI processing restarted for this source');
      fetchApprovedNotes();
    } catch (err) {
      toast.error('Failed to restart AI processing');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <div>
            <h3 className="headline-sm">Knowledge Source Manager</h3>
            <p className="body-xs text-variant">Select documents to populate your neural map</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-md)' }}>
          {loading ? (
            <div className="flex justify-center p-xl">
              <div className="spinner"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center p-xl text-variant">
              No approved notes found to scan.
            </div>
          ) : (
            <div className="source-list">
              {notes.map(note => (
                <div key={note._id} className="source-item card glass" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div className="body-md" style={{ fontWeight: 600 }}>{note.title}</div>
                    <div className="body-xs text-variant" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <span>{note.metadata.subject}</span>
                      <span className={`badge badge-sm badge-${note.embeddingStatus === 'complete' ? 'primary' : 'pending'}`}>
                        {note.embeddingStatus === 'complete' ? 'AI Ready' : 'Processing...'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {note.embeddingStatus === 'failed' && (
                      <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => handleRetry(note._id)}
                        title="Retry processing this document"
                      >
                        <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>refresh</span>
                      </button>
                    )}
                    
                    <button 
                      className={`btn btn-sm ${syncingIds.has(note._id) ? 'btn-secondary' : 'btn-ai'}`}
                      onClick={() => handleSync(note)}
                      disabled={syncingIds.has(note._id) || note.embeddingStatus !== 'complete'}
                    >
                      {syncingIds.has(note._id) ? (
                        <span className="spinner spinner-xs" style={{ marginRight: 0 }}></span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology</span>
                          {note.embeddingStatus === 'complete' ? 'Map to Brain' : 'Processing...'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--space-md)' }}>
          <button className="btn btn-primary btn-sm w-full" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
