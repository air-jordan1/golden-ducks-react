import { useCallback, useState, useEffect } from 'react';
import '../App.css';
import VoiceInputTest from './AudioTest.jsx';
import SpeechRecognition from 'react-speech-recognition';
import { maxLevel, levelDescriptions } from './components/constants.js';

function levelIdToName(level) {
  if (level === 1) return levelOne;
  if (level === 2) return levelTwo;
  if (level === 3) return levelThree;
  if (level === maxLevel) return (word) => '_'.repeat(word.length);
}

function levelOne(word) { // Level 1 difficulty: Here for easy polymorphism
  return word;
}

// Level 2 difficulty: Blank 30% of words (3 out of every 10)
function levelTwo(word, index) {
  if (index % 10 < 7) return word;
  else return '_'.repeat(word.length);
}

function levelThree(word, index) {// Level 3 difficulty: Blank two-thirds the words
  if (index % 3 === 0) return word;
  else return '_'.repeat(word.length);
}

// Blank words for increasing difficulty
function blankOutWords(text, difficulty) {
  const words = text.trim().split(' ');
  return words.map((word, index) => difficulty(word, index)).join(' ');
}

// Drilling screen
function TypingDrillRunning(param) {
  return (
    <div style={{ width: '100%' }}>
      {/* Running time info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span className="label-text" style={{ fontSize: '13px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>
          Level {param.level} — {levelDescriptions[param.level - 1].desc}
        </span>
        <span className="label-text" style={{ fontSize: '13px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>
          Translation: {param.translation}
        </span>
        <span className="label-text">Time: {param.time}s</span>
      </div>
      {/* Verse Reference + Input field */}
      {param.drillMode === 'simple' && simpleInputMode(param.currentPassage, levelIdToName(param.level), param.inputRef, param.handleKeyDown, param.handleSubmit, param.drillMode, param.finalTranscript, param.listening, param.resetTranscript)}
      {param.drillMode === 'overlay' && overlayInputMode(param.currentPassage, levelIdToName(param.level), param.inputRef, param.handleKeyDown, param.handleSubmit, param.drillMode)}
      <button className="btn-modern" onClick={param.handleSubmit} style={{ marginTop: '16px', width: '100%' }}>Submit Result</button>
      <button className="btn-modern" onClick={param.onBack} style={{ marginTop: '10px', width: '100%' }}>Back</button>
    </div>
  );
}

function simpleInputMode(currentPassage, level, inputRef, handleKeyDown, handleSubmit, drillMode, finalTranscript, listening, resetTranscript) {
  const audioSupported = SpeechRecognition.browserSupportsSpeechRecognition();

  if (!audioSupported) {
    alert("Your browser doesn't support speech recognition.");
  }
  // Stop any ongoing listening session when the component first loads
  useEffect(() => {
    SpeechRecognition.stopListening();
  }, []);

  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    } else {
      handleKeyDown(event);
    }
  }, [handleKeyDown, handleSubmit]);

  const [userInput, setUserInput] = useState('');
  //const clearInput = () => setUserInput('');

  // When voice transcript updates, append it to the textarea state
  useEffect(() => {
    console.log('finalTranscript:', finalTranscript);
    if (finalTranscript && finalTranscript.trim() !== '') {
      console.log('Appending:', finalTranscript);
      setUserInput(prev => prev + ' ' + finalTranscript);
      resetTranscript(); // Clear the transcript after appending to avoid duplicates
    }
  }, [finalTranscript, resetTranscript]);
  
  const startListening = useCallback(() => {
    console.log('Starting to listen...');
    SpeechRecognition.startListening({ continuous: true, interimResults: true });
  }, []);

  return (
    <div>
      {/* Verse reference */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#374151', fontSize: '16px', lineHeight: '1.6' }} onCopy={(e) => e.preventDefault()}>
          {blankOutWords(currentPassage, level)}
        </p>
      </div>
      <div className="drill-input-container">
        {/* Text field */}
        <textarea
          ref={inputRef}
          className="drill-text-input"
          rows={4}
          placeholder="Timer starts when you start typing..."
          onKeyDown={handleInputKey}
          autoComplete="off"
          spellCheck="false"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        {audioSupported &&
          <div className="drill-audio-input">
            {!listening &&
              <button className="audio-button" aria-label="Start listening" onClick={() => SpeechRecognition.startListening({ continuous: true, interimResults: true })}>▶</button>
            }
            {listening &&
              <button className="audio-button" aria-label="Stop listening" onClick={SpeechRecognition.stopListening}>🔴</button>
            }
            <p>{listening ? "Listening" : "Paused"}</p>
          </div>
        }
      </div>
    </div>);
}

function overlayInputMode(currentPassage, level, inputRef, handleKeyDown, handleSubmit) {
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    } else {
      handleKeyDown(event);
    }
  }, [handleKeyDown, handleSubmit]);

  return (
    <div className="drill-overlay-container">
      {/* Verse reference */}
      <div className="drill-background" onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
        <p onCopy={(e) => e.preventDefault()}>
          {blankOutWords(currentPassage, level)}
        </p>
      </div>
      {/* Input field */}
      <textarea
        className="drill-overlay"
        ref={inputRef}
        onKeyDown={handleInputKey}
        autoComplete="off"
        spellCheck="false"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      />
    </div>);
}

export default TypingDrillRunning;
