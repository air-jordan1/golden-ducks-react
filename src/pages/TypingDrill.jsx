import React, { useState, useRef, useEffect, useCallback } from 'react';

const STATES = {
  INTRO: 'intro',
  RUNNING: 'running',
  RESULTS: 'results'
};

function TypingDrillIntro(props) {
    return (
      <div>
        <p>Press start to begin typing.</p>
        <Button text="Start" onClick={props.onStart} />
      </div>
    );
};

function TypingDrillRunning(props) {
    return (
      <div>
        <p>You will be timed from the moment you start typing. {props.time}s elapsed.</p>
        <div>
            <div name="results"></div>
            <InputField inputRef={props.inputRef} handleKeyDown={props.handleKeyDown} handleSubmit={props.handleSubmit} />
            <Button text="submit" onClick={props.handleSubmit} />
        </div>
      </div>
    );
};

function TypingDrillResults(props) {
    return (
      <div>
        <p>You typed: "{props.userInput}" in {props.time} seconds</p>
        <p>The correct text is: "{props.currentPassage}"</p>
      </div>
    );
};

function InputField(props) {
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      props.handleSubmit();
    } else {
      props.handleKeyDown(event);
    }
  }, [props]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={ghostTextStyle}> Jesus wept. </div>
      <input 
        ref={props.inputRef} 
        name="drillInput" 
        type="text" 
        style={inputStyle} 
        onKeyDown={handleInputKey} 
      />
    </div>
  );
};

function TypingDrill() {
  const [stage, setStage] = useState(STATES.INTRO);

  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);
  const currentPassage = "Jesus wept.";

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  // Start the timer when the user starts typing, and stop it when they submit
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);
  // Focus the input field when the stage changes to RUNNING
  useEffect(() => {
    if (stage === STATES.RUNNING) {
      inputRef.current?.focus();
    }
  }, [stage]);

  const handleKeyDown = useCallback((event) => {
    if (!isRunning) {
      setIsRunning(true);
      setTime(0);
    }
  }, [isRunning]);

  function handleStart() {
    setStage(STATES.RUNNING);
  };

  function handleSubmit() {
    setIsRunning(false);
    const val = inputRef.current.value;
    setUserInput(val);
    setStage(STATES.RESULTS);
  };

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
      {stage === STATES.INTRO && <TypingDrillIntro onStart={handleStart} />}
      {stage === STATES.RUNNING && <TypingDrillRunning time={time} inputRef={inputRef} handleKeyDown={handleKeyDown} handleSubmit={handleSubmit} />}
      {stage === STATES.RESULTS && <TypingDrillResults userInput={userInput} time={time} currentPassage={currentPassage} />}
    </div>
  );
};

function Button(props) {
  return ( 
    <button style={buttonStyle} onClick={props.onClick}>{props.text}</button>
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

export default TypingDrill;
