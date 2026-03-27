import React from 'react';
import { useParams, Link } from 'react-router-dom';
import "../App.css"; 
import BackButton from "./components/BackButton"; 

function Welcome() {
  const { email } = useParams();

  return (
    <div className="page-container">
      <div className="modern-card welcome-card">

        <h2 className="label-text">Signed in as</h2>
        <h1 className="email-display">{email}</h1>

        <h3 className="subtitle" style={{ color: '#111827', fontWeight: '600', marginBottom: '24px' }}>
          What do you want to learn?
        </h3>
        
        <div className="button-group">
          <Link to="/" className="btn-modern">Home</Link>
          <Link to="/typing-drill" className="btn-modern">Typing Drill</Link>
          <Link to="/account" className="btn-modern">Account</Link>
          <Link to="/settings" className="btn-modern">Settings</Link>
        </div>
        
      </div>
    </div>
  );
}

export default Welcome;