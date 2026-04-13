import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Economics', 'Psychology', 'Engineering',
  'Accounting', 'Law', 'Medicine', 'Philosophy', 'Sociology',
];

export default function TopHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropdownRef = useRef(null);

  const year = searchParams.get('year') || '';
  const semester = searchParams.get('semester') || '';
  const subject = searchParams.get('subject') || '';

  const activeFilterCount = [year, semester, subject].filter(Boolean).length;

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/discover') {
      navigate(`/discover?search=${encodeURIComponent(searchValue)}`);
    } else {
      setSearchParams(prev => {
        if (searchValue) prev.set('search', searchValue);
        else prev.delete('search');
        return prev;
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      
      // If changing year, clear semester as it might be invalid
      if (key === 'year') {
        prev.delete('semester');
      }
      
      return prev;
    });
    
    // Auto redirect to discover if we apply a filter while not there
    if (location.pathname !== '/discover') {
      const newParams = new URLSearchParams(searchParams);
      if (value) newParams.set(key, value);
      else newParams.delete(key);
      if (key === 'year') newParams.delete('semester');
      navigate(`/discover?${newParams.toString()}`);
    }
  };

  const clearFilters = () => {
    setSearchParams(prev => {
      prev.delete('year');
      prev.delete('semester');
      prev.delete('subject');
      return prev;
    });
    if (location.pathname !== '/discover') {
      navigate('/discover');
    }
  };

  const semesters = year ? [1, 2, 3, 4, 5, 6, 7, 8].slice(0, parseInt(year) * 2) : [];

  return (
    <header className="top-header">
      <div className="top-header-search-container">
        <form className="global-search-bar" onSubmit={handleSearchSubmit}>
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search notes globally..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>

        <div className="filter-dropdown-container" ref={dropdownRef}>
          <button 
            className={`btn btn-secondary filter-toggle-btn ${activeFilterCount > 0 ? 'active-filters' : ''}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
            type="button"
          >
            <span className="material-symbols-outlined">tune</span>
            Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          {filtersOpen && (
            <div className="filter-dropdown-menu">
              <div className="filter-dropdown-header">
                <h3>Filter Discover</h3>
                {activeFilterCount > 0 && (
                  <button className="btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
                )}
              </div>
              
              <div className="filter-group">
                <label>Year</label>
                <select
                  className="select-field"
                  value={year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
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
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
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
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
