import React from 'react';
import { useParams, Link } from 'react-router-dom';

function Welcome() {
  const { name } = useParams();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(to right, #45a247, #283c86)',
      color: 'white'
    }}>
      <h1>Welcome, {name}!</h1>
      <h2>What do you want to learn?</h2>
      <div>
        <Link to="/"><button style={buttonStyle}>Home</button></Link>
        <Link to="/typing-drill"><button style={buttonStyle}>Typing Drill</button></Link>
        <Link to="/account"><button style={buttonStyle}>Account</button></Link>
      </div>
    </div>
  );
}

const buttonStyle = {
  backgroundColor: '#4CAF50',
  border: 'none',
  color: 'white',
  padding: '15px 32px',
  textAlign: 'center',
  textDecoration: 'none',
  display: 'inline-block',
  fontSize: '16px',
  margin: '4px 2px',
  cursor: 'pointer',
  borderRadius: '12px',
};

export default Welcome;
