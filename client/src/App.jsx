import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import ViewNote from './pages/ViewNote';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/view/:slugId" element={<ViewNote />} />
      </Routes>
      <footer className="footer">
        © 2026 Noteables. Powered by Kinetic Neural Core.
      </footer>
    </>
  );
}

export default App;
