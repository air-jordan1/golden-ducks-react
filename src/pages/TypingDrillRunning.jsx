import { useCallback } from 'react';
import '../App.css';
import { auth, db } from "../firebase";

const maxLevel = 4;

const levelDescriptions = [
    { level: 1, label: 'Level 1', desc: 'Full verse shown — type it out' },
    { level: 2, label: 'Level 2', desc: '30% of words hidden — fill in the blanks' },
    { level: 3, label: 'Level 3', desc: '66% of words hidden — fill in the blanks' },
    { level: maxLevel, label: `Level ${maxLevel}`, desc: 'No verse shown — type from memory' },
  ];

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

const COMPLETION_THRESHOLD = 90;

// Normalize text to a common format for comparison (lowercase, remove punctuation, trim)
function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

// Calculate Accuracy
function calcAccuracy(typed, target) {
  const targetWords = normalize(target).split(/\s+/).filter(Boolean);
  const typedWords = normalize(typed).split(/\s+/).filter(Boolean);
  if (!targetWords.length) return 0;
  let correct = 0;
  for (let i = 0; i < targetWords.length; i++) {
    if (typedWords[i] === targetWords[i]) correct++;
  }
  return Math.round((correct / targetWords.length) * 100);
}

// Converts a string like "John 3:16" to a safe string like "john_3_16" for 
// easy behind the scenes storage and lookup of progress
function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
}

// Blank words for increasing difficulty
function blankOutWords(text, difficulty) {
  const words = text.trim().split(' ');
  return words.map((word, index) => difficulty(word, index)).join(' ');
}

// Drilling screen
function TypingDrillRunning({ time, inputRef, handleKeyDown, handleSubmit, currentPassage, level, onBack, drillMode }) {
  userSelect: 'none';
  return (
    <div style={{ width: '100%' }}>
      {/* Running time info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span className="label-text" style={{ fontSize: '13px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>
          Level {level} — {levelDescriptions[level - 1].desc}
        </span>
        <span className="label-text">Time: {time}s</span>
      </div>
      {/* Verse Reference + Input field */}
      {drillMode === 'simple' && simpleInputMode(currentPassage, levelIdToName(level), inputRef, handleKeyDown, handleSubmit, drillMode)}
      {drillMode === 'overlay' && overlayInputMode(currentPassage, levelIdToName(level), inputRef, handleKeyDown, handleSubmit,drillMode)}

      <button className="btn-modern" onClick={handleSubmit} style={{ marginTop: '16px', width: '100%' }}>
        Submit Result
      </button>
      <button className="btn-modern" onClick={onBack} style={{ marginTop: '10px', width: '100%' }}>
        Back
      </button>
    </div>
  );
}

function simpleInputMode(currentPassage, level, inputRef, handleKeyDown, handleSubmit, drillMode) {
  
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else {
      handleKeyDown(event);
    }
  }, [handleKeyDown, handleSubmit]);

  return (
  <div> 
    {/* Verse reference */}
    <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
      <p style={{ margin: 0, fontStyle: 'italic', color: '#374151', fontSize: '16px', lineHeight: '1.6' }} onCopy={(e) => e.preventDefault()}>
        {blankOutWords(currentPassage, level)}
      </p>
    </div>
    {/* Input field */}
    <textarea
      ref={inputRef}
      name="drillInput"
      rows={4}
      placeholder="Timer starts when you start typing..."
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        fontSize: '16px',
        color: '#111827',
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'none',
        boxSizing: 'border-box',
        lineHeight: '1.6',
      }}
      onKeyDown={handleInputKey}
      autoComplete="off"
      spellCheck="false"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    />
  </div>);
}

function overlayInputMode(currentPassage, level, inputRef, handleKeyDown, handleSubmit) {
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else {
      handleKeyDown(event);
    }
  }, [handleKeyDown, handleSubmit]);

  return (
  <div className="drill-input-container" style={drill_input_container}> 
    {/* Verse reference */}
    <div className="drill-background-layer"  onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
      <p style={drill_background_layer} onCopy={(e) => e.preventDefault()}>
        {blankOutWords(currentPassage, level)}
      </p>
    </div>
    {/* Input field */}
    <textarea
      className="drill-overlay-input"
      style={drill_overlay_input}
      ref={inputRef}
      name="drillInput"
      rows={4}
      onKeyDown={handleInputKey}
      autoComplete="off"
      spellCheck="false"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    />
  </div>);
}

const drill_input_container = {
  width: '100%',
  height: '400px',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  fontSize: '16px',
  color: '#111827',
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'none',
  boxSizing: 'border-box',
  lineHeight: '1.6',
  position: 'relative',
  display: 'inline-block',
  fontFamily: 'Cascadia Code, monospace',
}

const drill_background_layer = {
  position: "absolute",
  height: '100%', 
  width: "100%",
  top: 0,
  left: 0,
  margin: 0, 
  fontSize: '16px', 
  display: "block",
  textAlign: 'left',
  fontFamily: 'Courier New',
  lineHeight: '1.6',
  boxSizing: "border-box",
  padding: '12px',
  color: '#374151', 
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  fontFamily: 'Cascadia Code, monospace',
}

const drill_overlay_input = {
  position: "absolute",
  height: '100%',
  width: "100%",
  top: 0,
  left: 0,
  margin: 0,
  fontSize: "16px",
  display: "block",
  textAlign: 'left',
  fontFamily: 'Courier New',
  lineHeight: '1.6',
  boxSizing: "border-box",
  padding: '12px',
  color: '#111827',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  fontFamily: 'Cascadia Code, monospace',

  resize: 'none',
  background: "transparent",
}

export default TypingDrillRunning;
