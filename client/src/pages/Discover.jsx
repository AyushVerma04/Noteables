import { useState, useEffect } from 'react';
import API from '../api/axios';
import NoteCard from '../components/NoteCard';
import SkeletonCard from '../components/SkeletonCard';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Economics', 'Psychology', 'Engineering',
  'Accounting', 'Law', 'Medicine', 'Philosophy', 'Sociology',
];

export default function Discover() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  }, [year, semester, subject]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  const clearFilters = () => {
    setYear('');
    setSemester('');
    setSubject('');
    setSearch('');
  };

  const semesters = year ? [1, 2, 3, 4, 5, 6, 7, 8].slice(0, year * 2) : [];

  return (
    <div className="discover-layout">
      {/* Mobile Filter Toggle */}
      <div className="filter-toggle-mobile">
        <button
          className="btn btn-secondary w-full"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <span className="material-symbols-outlined">tune</span>
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filter Sidebar */}
      <aside className={`filter-sidebar ${filtersOpen ? '' : 'collapsed'}`}>
        <h2>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
          Filters
        </h2>

        <div className="filter-group">
          <label>Year</label>
          <select
            className="select-field"
            value={year}
            onChange={(e) => { setYear(e.target.value); setSemester(''); }}
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Semester</label>
          <select
            className="select-field"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            disabled={!year}
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Subject</label>
          <select
            className="select-field"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {(year || semester || subject) && (
          <button className="btn btn-ghost btn-sm w-full" onClick={clearFilters} style={{ marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>clear</span>
            Clear Filters
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div>
        {/* Search Bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search notes by title, subject, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-notes"
          />
        </form>

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
