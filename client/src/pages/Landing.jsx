import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        {/* Floating Glass Cards */}
        <div className="hero-float-card left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: 20 }}>description</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Active Specimen</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>BIO_SYS_LAB_092.pdf</div>
            </div>
          </div>
        </div>

        <div className="hero-float-card right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', fontSize: 20 }}>psychology</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>AI Synapse</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>Processing Ready</div>
            </div>
          </div>
        </div>

        <h1 className="hero-title">
          TRANSFORM YOUR<br />
          <span className="highlight">KINETIC THOUGHT.</span>
        </h1>

        <p className="hero-subtitle">
          The Neo-Industrial Laboratory for high-octane academic mastery.
          Not just a folder for notes — a molten engine of discovery, sharing,
          and collaborative learning.
        </p>

        <div className="hero-actions">
          <Link to="/discover" className="btn btn-primary btn-lg">
            <span className="material-symbols-outlined">explore</span>
            Discover Notes
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-secondary btn-lg">
              <span className="material-symbols-outlined">person_add</span>
              Get Started
            </Link>
          )}
          {user && (
            <Link to="/upload" className="btn btn-secondary btn-lg">
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload Notes
            </Link>
          )}
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">12,847</div>
            <div className="hero-stat-label">Notes Shared</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">3,204</div>
            <div className="hero-stat-label">Students Active</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">98.2%</div>
            <div className="hero-stat-label">Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h2 className="display-sm" style={{ marginBottom: 'var(--space-sm)' }}>The Alchemist's Toolkit</h2>
          <p className="text-variant body-lg" style={{ maxWidth: 520, margin: '0 auto' }}>
            Everything you need to transform raw lecture data into academic gold.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined">cloud_upload</span>
            </div>
            <h3>Presigned Uploads</h3>
            <p>
              Direct-to-cloud file uploads. Your PDFs and presentations flow straight
              to Supabase storage — zero server bottleneck. Lightning fast.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(255, 219, 60, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)' }}>manage_search</span>
            </div>
            <h3>Smart Discovery</h3>
            <p>
              Filter by year, semester, subject, and teacher. Find the exact notes
              you need with compound slug search and intelligent filtering.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(255, 86, 128, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary-container)' }}>admin_panel_settings</span>
            </div>
            <h3>Admin Quality Gate</h3>
            <p>
              Every upload passes through an admin approval queue. Only verified,
              high-quality academic material makes it to the archive.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined">chat</span>
            </div>
            <h3>Chat with Notes</h3>
            <p>
              AI-powered document chat coming in Phase 2. Ask questions about any
              uploaded document and get contextual, cited answers.
            </p>
            <span className="badge badge-secondary" style={{ marginTop: 12 }}>Coming Phase 2</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(255, 219, 60, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)' }}>spatial_audio_off</span>
            </div>
            <h3>Text-to-Audio</h3>
            <p>
              Transform written notes into podcast-style audio. Study on-the-go
              with AI-generated audio summaries of your documents.
            </p>
            <span className="badge badge-secondary" style={{ marginTop: 12 }}>Coming Phase 2</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(255, 86, 128, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary-container)' }}>thumb_up</span>
            </div>
            <h3>Social Voting</h3>
            <p>
              Upvote the best notes and leave comments. Build reputation points
              and surface the highest-quality materials for everyone.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
