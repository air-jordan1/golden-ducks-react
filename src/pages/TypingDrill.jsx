import { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { map } from '../BookIDMap';
import { parseReference, parsedRefToID, fetchPassage, getTranslationId } from '../Passage';
import TypingDrillIntro from './TypingDrillIntro';

const STATES = {
  INTRO: 'intro',
  RUNNING: 'running',
  RESULTS: 'results'
};

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

// Clean verse numbers like [1], [2], etc.
function cleanVerseNumbers(text) {
  return text
  .replace(/\[[^\]]*\]/g, '') // Remove [1], [2], etc.
  .replace('¶', '')
  .replace(/\s+/g, ' ').trim(); // Clean up extra whitespace
}

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

// Typing Drill main function
function TypingDrill() {
  const [state, setState] = useState(STATES.INTRO); // running states
  const [userInput, setUserInput] = useState(''); // user input
  const [currentPassage, setCurrentPassage] = useState(''); // current passage
  const [currentReference, setCurrentReference] = useState(''); // current reference
  const [currentLevel, setCurrentLevel] = useState(1); // current level
  const [translation, setTranslation] = useState('KJV'); // current translation
  const [accuracy, setAccuracy] = useState(0); // accuracy
  const [levelCompleted, setLevelCompleted] = useState(false); // level completed
  const inputRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  // set the translation
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then(snap => {
        if (snap.exists() && snap.data().preferredTranslation) {
          setTranslation(snap.data().preferredTranslation);
        }
      })
      .catch(console.error);
  }, []);

  // Set up a timer that starts and stops based on the isRunning state
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Auto-focus on the input when the drill starts
  useEffect(() => {
    if (state === STATES.RUNNING) inputRef.current?.focus();
  }, [state]);

  const handleKeyDown = useCallback((event) => {
    if (!isRunning && event.key !== 'Enter') {
      setIsRunning(true);
      setTime(0);
    }
  }, [isRunning]);

  function handleStart(passageText, reference, level) {
    setCurrentPassage(passageText);
    setCurrentReference(reference);
    setCurrentLevel(level);
    setState(STATES.RUNNING);
  }

  function handleBack() {
    setUserInput('');
    setAccuracy(0);
    setLevelCompleted(false);
    setIsRunning(false);
    setTime(0);
    setState(STATES.INTRO);
  }

  async function handleSubmit() {
    setIsRunning(false);
    const val = cleanVerseNumbers(inputRef.current.value);
    const acc = calcAccuracy(val, cleanVerseNumbers(currentPassage));
    setUserInput(val);
    setAccuracy(acc);
    const completed = acc >= COMPLETION_THRESHOLD;
    setLevelCompleted(completed);
    setState(STATES.RESULTS);

    const user = auth.currentUser;
    if (user && completed) {
      try {
        const existing = await getDocs(
          query(collection(db, "drillResults"),
            where("userId", "==", user.uid),
            where("reference", "==", currentReference))
        );

        const record = {
          userId: user.uid,
          passage: currentPassage,
          reference: currentReference,
          timeTaken: time,
          accuracy: acc,
          level: currentLevel,
          translation,
          completedAt: new Date(),
        };

        if (!existing.empty) {
          await setDoc(doc(db, "drillResults", existing.docs[0].id), record);
        } else {
          await addDoc(collection(db, "drillResults"), record);
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const verseProgress = userSnap.exists() ? (userSnap.data().verseProgress || {}) : {};
        const key = getProgressKey(currentReference);

        if (currentLevel > (verseProgress[key] || 0)) {
          await updateDoc(userRef, { [`verseProgress.${key}`]: currentLevel });
        }

        if (currentLevel === 4 && acc >= COMPLETION_THRESHOLD) {
          await updateDoc(userRef, { memorizedVerses: arrayUnion(currentReference) });
        }
      } catch (err) {
        console.error("Firestore write failed:", err);
      }
    }
  }

  function handleRestart() {
    setUserInput('');
    setAccuracy(0);
    setLevelCompleted(false);
    setTime(0);
    setState(STATES.INTRO);
  }

  function handleNextLevel() {
    setUserInput('');
    setAccuracy(0);
    setLevelCompleted(false);
    setTime(0);
    setCurrentLevel(l => l + 1);
    setState(STATES.RUNNING);
  }

  function handleRetry() {
  setUserInput('');
  setAccuracy(0);
  setLevelCompleted(false);
  setTime(0);
  setState(STATES.RUNNING);
}

  return (
    <div className="page-container">
      <div className="modern-card welcome-card" style={{ marginTop: '20px' }}>
        <HeaderArea />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {state === STATES.INTRO && (
            <TypingDrillIntro onStart={handleStart} translation={translation} />
          )}
          {state === STATES.RUNNING && (
            <TypingDrillRunning
              time={time}
              inputRef={inputRef}
              handleKeyDown={handleKeyDown}
              handleSubmit={handleSubmit}
              currentPassage={currentPassage}
              level={currentLevel}
              onBack={handleBack}
            />
          )}
          {state === STATES.RESULTS && (
            <TypingDrillResults
              userInput={userInput}
              time={time}
              accuracy={accuracy}
              currentPassage={currentPassage}
              level={currentLevel}
              levelCompleted={levelCompleted}
              onRestart={handleRestart}
              onNextLevel={handleNextLevel}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Drilling screen
function TypingDrillRunning({ time, inputRef, handleKeyDown, handleSubmit, currentPassage, level, onBack }) {
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
      {/* Verse reference */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#374151', fontSize: '16px', lineHeight: '1.6' }} onCopy={(e) => e.preventDefault()}>
          {blankOutWords(cleanVerseNumbers(currentPassage), levelIdToName(level))}
        </p>
      </div>
      {/* Input field */}
      <InputField
        inputRef={inputRef}
        handleKeyDown={handleKeyDown}
        handleSubmit={handleSubmit}
      />

      <button className="btn-modern" onClick={handleSubmit} style={{ marginTop: '16px', width: '100%' }}>
        Submit Result
      </button>
      <button className="btn-modern" onClick={onBack} style={{ marginTop: '10px', width: '100%' }}>
        Back
      </button>
    </div>
  );
}

// Results screen
function TypingDrillResults({ userInput, time, accuracy, currentPassage, level, levelCompleted, onRestart, onNextLevel, onRetry }) {
  const accuracyColor = accuracy >= 90 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '8px' }}>Results</h2>
      <p className="label-text" style={{ marginBottom: '20px' }}>Level {level}</p>

      {levelCompleted ? (
        <div style={{ backgroundColor: '#d1fae5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: '600', fontSize: '15px' }}>
            Level {level} completed! {level < maxLevel ? `Try Level ${level + 1} next.` : 'You have this verse memorized!'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fee2e2', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#991b1b', fontWeight: '600', fontSize: '15px' }}>
            Need {COMPLETION_THRESHOLD}% accuracy to complete this level. Keep practicing!
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Time</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', margin: 0 }}>{time}s</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Accuracy</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: accuracyColor, margin: 0 }}>{accuracy}%</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
        <p className="label-text">You typed:</p>
        <p style={{ fontSize: '15px', color: '#111827', margin: '0 0 16px 0' }}>"{userInput}"</p>
        <p className="label-text">Target:</p>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>"{cleanVerseNumbers(currentPassage)}"</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          className="btn-modern"
          style={{ width: '100%' }}
          onClick={onRetry}
        >
          Try again
        </button>
        {levelCompleted && level < maxLevel && (
          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', width: '100%' }}
            onClick={onNextLevel}
          >
            Advance to Level {level + 1}
          </button>
        )}
        <button
          className="btn-modern"
          style={{ width: '100%' }}
          onClick={onRestart}
        >
          Try a Different Verse
        </button>
      </div>
    </div>
  );
}

function HeaderArea() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h1 className="title">Typing Drill</h1>
      <p className="subtitle">Test your speed and accuracy.</p>
    </div>
  );
}

function InputField({ inputRef, handleKeyDown, handleSubmit }) {
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else {
      handleKeyDown(event);
    }
  }, [handleKeyDown, handleSubmit]);

  return (
    <textarea
      ref={inputRef}
      name="drillInput"
      rows={4}
      placeholder="Start typing here..."
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
  );
}

export default TypingDrill;
