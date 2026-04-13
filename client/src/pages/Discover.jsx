import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import NoteCard from '../components/NoteCard';
import SkeletonCard from '../components/SkeletonCard';

export default function Discover() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const year = searchParams.get('year') || '';
  const semester = searchParams.get('semester') || '';
  const subject = searchParams.get('subject') || '';

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (semester) params.semester = semester;
      if (subject) params.subject = subject;
      if (search) params.search = search;
      const { data } = await API.get('/notes', { params });
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [year, semester, subject, search]);

  return (
    <div className="discover-layout-clean">
      {/* Main Content */}
      <div>

        {/* Notes Grid */}
        {loading ? (
          <div className="notes-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : notes.length > 0 ? (
          <div className="notes-grid">
            {notes.map(note => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined">search_off</span>
            <h3>No Notes Found</h3>
            <p>Try adjusting your filters or search query.<br />Be the first to upload notes for this category!</p>
          </div>
        )}
      </div>
    </div>
  );
}
