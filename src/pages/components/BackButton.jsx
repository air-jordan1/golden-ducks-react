import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={backButtonStyle}
        onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
        onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
    </div>
  );
}

const backButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '15px',
  fontWeight: '600',
  padding: '0',
  marginBottom: '24px',
  transition: 'color 0.2s ease',
};

export default BackButton;