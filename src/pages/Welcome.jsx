import { useParams, Link, useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../App.css";

function Welcome() {
  const { email } = useParams();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const avatarLetter = email ? email[0].toUpperCase() : '?';

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-left">
          <span className="nav-logo">Scripturize</span>
          <Link to="/typing-drill" className="nav-link" style={{ textDecoration: 'none' }}>Study tools</Link>
          <Link to="/settings" className="nav-link" style={{ textDecoration: 'none' }}>Translations</Link>
        </div>
        <div className="dashboard-nav-right">
          <span className="nav-user-email">{email}</span>
          <div className="nav-avatar">{avatarLetter}</div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: '1px solid #e8eaf0',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#5a6377',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="dashboard-hero">
        <h1 className="dashboard-greeting">What do you want to memorize?</h1>
        <p className="dashboard-tagline">Pick a tool and start building your Scripture memory today.</p>
      </section>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <Link to="/typing-drill" className="dashboard-card">
          <div className="dashboard-card-icon icon-blue">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#8b0000" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3>Typing Drill</h3>
          <p>Choose a verse and type it from memory to sharpen retention</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/account" className="dashboard-card">
          <div className="dashboard-card-icon icon-green">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#6b4422" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3>My Account</h3>
          <p>View your drill history, accuracy scores, and memorized verses</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/settings" className="dashboard-card">
          <div className="dashboard-card-icon icon-purple">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#3d2b1f" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Choose your preferred Bible translation</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
