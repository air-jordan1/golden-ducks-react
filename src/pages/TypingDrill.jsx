import React, { useState } from 'react';

function TypingDrillPage() {
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleStart() {
    setStarted(true);
  };

  function handleSubmit() {
    setSubmitted(true);
  }

  function TypingDrillIntro() {
    return started ? (
      <div>
        <p>You will be timed from the moment you start typing.</p>
        <div>
            <div name="results"></div>
            <InputField />
            <Button text="submit" onclick={handleSubmit} />
        </div>
      </div>
    ) : <TypingDrillRunning />;
  };

  function TypingDrillRunning() {
    return (
      <div>
        <p>Press start to begin typing.</p>
        <Button text="Start" onclick={handleStart} />
      </div>
    );
  }

  

  //Start of rendering the page
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
};

function InputField() {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={ghostTextStyle}> Jesus wept. </div>
      <input name="drillInput" type="text" style={inputStyle} />
  </div>
  );
};

function Button(props) {
  return ( 
    <button style={buttonStyle} onClick={props.onclick}>{props.text}</button>
  );
};

function HeaderArea() {
  return (
    <h1>Typing Drill</h1>
  );
}; 

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

const inputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid white',
    color: 'black',
    padding: '10px',
    fontSize: '16px',
    font: 'inherit',
    outline: 'none',
    zIndex: 2,
    position: 'relative'
};

const ghostTextStyle = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  color: 'lightgray',
  fontSize: '16px',
  pointerEvents: 'none',
  zIndex: 1
}

export default TypingDrillPage;
