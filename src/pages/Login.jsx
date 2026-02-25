
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name) {
      navigate(`/welcome/${name}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(to right, #283c86, #45a247)',
      color: 'white'
    }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            marginBottom: '10px',
            width: '200px'
          }}
        />
        <button type="submit" style={{
          padding: '10px 20px',
          borderRadius: '5px',
          border: 'none',
          background: '#4CAF50',
          color: 'white',
          cursor: 'pointer'
        }}>Enter</button>
      </form>
    </div>
  );
}

export default Login;
