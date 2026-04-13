import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="global-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">auto_stories</span>
          <h2>Noteables</h2>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group-title">Menu</div>
        
        <NavLink to="/discover" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">explore</span>
          Discover
        </NavLink>
        
        <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">cloud_upload</span>
          Upload
        </NavLink>
        
        <NavLink to="/workspace" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">edit_document</span>
          Workspace
        </NavLink>

        <NavLink to="/brain" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">psychology</span>
          Omni-Brain
        </NavLink>
        
        <NavLink to="/nexus" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">hub</span>
          Nexus Assistant
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
             <span className="material-symbols-outlined">admin_panel_settings</span>
             Admin Dashboard
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-card">
           <div className="user-avatar">
             {user?.email?.charAt(0).toUpperCase()}
           </div>
           <div className="user-info">
             <div className="user-name">{user?.email?.split('@')[0]}</div>
             <div className="user-role">{user?.role}</div>
           </div>
        </div>
        <button className="btn btn-ghost w-full btn-logout" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
