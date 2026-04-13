import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <span className="material-symbols-outlined">auto_stories</span>
          Noteables
        </Link>

        <div className="navbar-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/discover">Discover</NavLink>
          {user && <NavLink to="/upload">Upload</NavLink>}
          {user && <NavLink to="/workspace">Workspace</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </div>

        <div className="navbar-auth">
          {user ? (
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span>{user.email.split('@')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/discover" onClick={() => setMenuOpen(false)}>Discover</Link>
        {user && <Link to="/upload" onClick={() => setMenuOpen(false)}>Upload</Link>}
        {user && <Link to="/workspace" onClick={() => setMenuOpen(false)}>Workspace</Link>}
        {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
        {user ? (
          <button onClick={handleLogout}>Logout ({user.email.split('@')[0]})</button>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
          </>
        )}
      </div>
    </>
  );
}
