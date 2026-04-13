import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const lowlight = createLowlight(common);

export default function Workspace() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Custom image upload handler
  const handleImageUpload = useCallback(async (file) => {
    try {
      const toastId = toast.loading('Uploading image...');
      
      // Get presigned URL specifically for workspace images
      const { data } = await API.post('/workspace/upload-image', {
        fileName: file.name,
        contentType: file.type,
      });

      // Upload to Supabase via presigned URL
      await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      toast.success('Image uploaded!', { id: toastId });
      return data.publicUrl;
    } catch (err) {
      toast.error('Image upload failed');
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your notes... (Try pasting an image!)',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: true,
        allowBase64: false, // We intercept base64
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none tiptap-editor',
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file).then(url => {
                if (url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              });
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0) {
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            handleImageUpload(file).then(url => {
              if (url && coordinates) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            });
            event.preventDefault();
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      // Autosave could be debounced here
    }
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/workspace');
      setNotes(data);
      if (data.length > 0) {
        loadNote(data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error('Failed to load notes');
      setLoading(false);
    }
  };

  const loadNote = async (id) => {
    try {
      const { data } = await API.get(`/workspace/${id}`);
      setActiveNoteId(data._id);
      setTitle(data.title);
      editor?.commands.setContent(data.content);
    } catch (err) {
      toast.error('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const { data } = await API.post('/workspace', {
        title: 'New Note',
        content: '',
      });
      setNotes([data, ...notes]);
      setActiveNoteId(data._id);
      setTitle(data.title);
      editor?.commands.setContent('');
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

  const saveNote = async () => {
    if (!activeNoteId) return;
    setSaving(true);
    try {
      const content = editor?.getHTML();
      await API.put(`/workspace/${activeNoteId}`, {
        title,
        content,
      });
      toast.success('Note saved');
      // Update list
      setNotes(notes.map(n => n._id === activeNoteId ? { ...n, title } : n));
    } catch (err) {
      toast.error('Failed to save node');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    try {
      await API.delete(`/workspace/${id}`);
      const newNotes = notes.filter(n => n._id !== id);
      setNotes(newNotes);
      toast.success('Note deleted');
      if (activeNoteId === id) {
        if (newNotes.length > 0) {
          loadNote(newNotes[0]._id);
        } else {
          setActiveNoteId(null);
          setTitle('');
          editor?.commands.setContent('');
        }
      }
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  if (!user) return null;

  return (
    <div className="workspace-layout">
      {/* Sidebar: Note List */}
      <div className="workspace-sidebar">
        <div className="workspace-header">
          <h2>My Workspace</h2>
          <button className="btn btn-primary btn-sm" onClick={createNewNote}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New
          </button>
        </div>
        
        {loading && <div className="loading-center"><div className="spinner"></div></div>}
        
        <div className="workspace-list">
          {notes.map(n => (
            <div 
              key={n._id} 
              className={`workspace-item ${activeNoteId === n._id ? 'active' : ''}`}
              onClick={() => loadNote(n._id)}
            >
              <div className="workspace-item-content">
                <div className="workspace-item-title">{n.title || 'Untitled Note'}</div>
                <div className="workspace-item-preview">{n.preview || 'No content...'}</div>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-delete" 
                onClick={(e) => deleteNote(e, n._id)}
                title="Delete note"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>delete</span>
              </button>
            </div>
          ))}
          {notes.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>edit_document</span>
              <p>No notes yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="workspace-main">
        {activeNoteId ? (
          <>
            <div className="editor-header">
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Note Title" 
                className="editor-title-input"
              />
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={saveNote}
                disabled={saving}
              >
                {saving ? 'Saving...' : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                    Save
                  </>
                )}
              </button>
            </div>
            
            {/* Editor Toolbar */}
            <div className="editor-toolbar">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'active' : ''}>
                B
              </button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'active' : ''}>
                I
              </button>
              <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor?.isActive('strike') ? 'active' : ''}>
                S
              </button>
              <div className="divider" />
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}>
                H1
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}>
                H2
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive('heading', { level: 3 }) ? 'active' : ''}>
                H3
              </button>
              <div className="divider" />
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'active' : ''}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_list_bulleted</span>
              </button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'active' : ''}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_list_numbered</span>
              </button>
              <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor?.isActive('codeBlock') ? 'active' : ''}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>code</span>
              </button>
              <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor?.isActive('blockquote') ? 'active' : ''}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_quote</span>
              </button>
            </div>
            
            <div className="editor-content-wrapper">
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">note_alt</span>
            <h3>Select or create a note</h3>
            <p>Your rich text personal workspace awaits.</p>
          </div>
        )}
      </div>
    </div>
  );
}
