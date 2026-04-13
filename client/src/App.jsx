import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import ViewNote from './pages/ViewNote';
import Workspace from './pages/Workspace';
import Brain from './pages/Brain';
import NexusAI from './pages/NexusAI';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
          <TopHeader />
          <div className="dashboard-content">
            <Routes>
              <Route path="/" element={<Navigate to="/discover" replace />} />
              <Route path="/login" element={<Navigate to="/discover" replace />} />
              <Route path="/register" element={<Navigate to="/discover" replace />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/view/:slugId" element={<ViewNote />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/brain" element={<Brain />} />
              <Route path="/nexus" element={<NexusAI />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/view/:slugId" element={<ViewNote />} />
        <Route path="/upload" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="/workspace" element={<Navigate to="/login" replace />} />
      </Routes>
      <footer className="footer">
        © 2026 Noteables. Powered by Kinetic Neural Core.
      </footer>
    </>
  );
}

export default App;
