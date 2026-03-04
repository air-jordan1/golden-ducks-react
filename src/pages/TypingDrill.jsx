import React, { useState } from 'react';

function TypingDrillPage() {
  const [started, setStarted] = useState(false);

  function handleStart() {
    setStarted(true);
  };

  function TypingDrillIntro() {
    return started ? (
      <div>
        <p>Typing drill in progress...</p>
      </div>
    ) : (
      <div>
        <p>Press start to begin typing.</p>
        <Button text="Start" onclick={handleStart} />
      </div>
    );
  };

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
      <HeaderArea />
      <TypingDrillIntro />
    </div>
  );
}

function Button(props) {
  return ( 
    <button style={buttonStyle} onClick={props.onclick}>{props.text}</button>
  );
}

function HeaderArea() {
  return (
    <h1>Typing Drill</h1>
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

export default TypingDrillPage;
