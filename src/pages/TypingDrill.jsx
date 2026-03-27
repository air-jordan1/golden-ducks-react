import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import BackButton from "./components/BackButton";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";

const STATES = {
  INTRO: 'intro',
  RUNNING: 'running',
  RESULTS: 'results'
};

function parseReference(ref) {
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const book = match[1].toLowerCase().replace(/\s+/g, '-');
  return { book, chapter: match[2], verse: match[3] };
}

function TypingDrill() {
  const [state, setState] = useState(STATES.INTRO);
  const [userInput, setUserInput] = useState('');
  const [currentPassage, setCurrentPassage] = useState('');
  const [translation, setTranslation] = useState('kjv');
  const inputRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

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

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (state === STATES.RUNNING) inputRef.current?.focus();
  }, [state]);

  const handleKeyDown = useCallback((event) => {
    if (!isRunning && event.key !== 'Enter') {
      setIsRunning(true);
      setTime(0);
    }
  }, [isRunning]);

  function handleStart(passageText) {
    setCurrentPassage(passageText);
    setState(STATES.RUNNING);
  }

  async function handleSubmit() {
    setIsRunning(false);
    const val = inputRef.current.value;
    setUserInput(val);
    setState(STATES.RESULTS);

    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, "drillResults"), {
        userId: user.uid,
        passage: currentPassage,
        userInput: val,
        timeTaken: time,
        translation,
        completedAt: new Date(),
      });
    }
  }

  return (
    <div className="page-container">
      <NavMenu />
      <div className="modern-card welcome-card" style={{ marginTop: '20px' }}>
        <HeaderArea />
        <BackButton />
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
            />
          )}
          {state === STATES.RESULTS && (
            <TypingDrillResults
              userInput={userInput}
              time={time}
              currentPassage={currentPassage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDrillIntro({ onStart, translation }) {
  const [reference, setReference] = useState('John 3:16');
  const [fetchedText, setFetchedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    const parsed = parseReference(reference);
    if (!parsed) {
      setError('Enter a reference like "John 3:16"');
      return;
    }
    setError('');
    setFetchedText('');
    setLoading(true);
    try {
      const res = await fetch(
        `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-${translation}/books/${parsed.book}/chapters/${parsed.chapter}/verses/${parsed.verse}.json`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFetchedText(data.text);
    } catch {
      setError('Verse not found. Check the reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <p className="label-text" style={{ marginBottom: '8px' }}>Verse reference</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={reference}
          onChange={e => { setReference(e.target.value); setFetchedText(''); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. John 3:16"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontSize: '16px',
            color: '#111827',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button className="btn-modern" onClick={handleLookup} disabled={loading || !reference.trim()}>
          {loading ? '...' : 'Look up'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
      )}

      {fetchedText && (
        <>
          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>{fetchedText}</p>
          </div>
          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none' }}
            onClick={() => onStart(fetchedText)}
          >
            Start Typing Drill
          </button>
        </>
      )}
    </div>
  );
}

function NavMenu() {
  return (
    <nav className="button-group" style={{ marginBottom: '20px' }}>
      <Link to="/" className="btn-modern">Home</Link>
      <Link to="/typing-drill" className="btn-modern">Typing Drill</Link>
      <Link to="/account" className="btn-modern">Account</Link>
      <Link to="/settings" className="btn-modern">Settings</Link>
    </nav>
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

function TypingDrillRunning(props) {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <p className="label-text" style={{ marginBottom: '24px' }}>Time: {props.time}s</p>
      <div style={{ marginBottom: '32px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <InputField
          inputRef={props.inputRef}
          handleKeyDown={props.handleKeyDown}
          handleSubmit={props.handleSubmit}
          currentPassage={props.currentPassage}
        />
      </div>
      <button className="btn-modern" onClick={props.handleSubmit}>Submit Result</button>
    </div>
  );
}

function TypingDrillResults(props) {
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '24px' }}>Results</h2>
      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
        <p className="label-text">You typed:</p>
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>"{props.userInput}"</p>
        <p className="label-text">Target text:</p>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0' }}>"{props.currentPassage}"</p>
      </div>
      <p className="title" style={{ fontSize: '20px', color: '#10b981' }}>Time: {props.time} seconds</p>
    </div>
  );
}

function InputField(props) {
  const handleInputKey = useCallback((event) => {
    if (event.key === 'Enter') {
      props.handleSubmit();
    } else {
      props.handleKeyDown(event);
    }
  }, [props]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '300px', textAlign: 'left' }}>
      <div style={ghostTextStyle}>{props.currentPassage}</div>
      <input
        ref={props.inputRef}
        name="drillInput"
        type="text"
        style={inputStyle}
        onKeyDown={handleInputKey}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
}

const inputStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '2px solid #e5e7eb',
  color: '#111827',
  padding: '12px 0',
  fontSize: '18px',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  position: 'relative',
  zIndex: 2,
  transition: 'border-color 0.2s ease',
};

const ghostTextStyle = {
  position: 'absolute',
  top: '12px',
  left: '0',
  color: '#9ca3af',
  fontSize: '18px',
  pointerEvents: 'none',
  zIndex: 1,
  whiteSpace: 'nowrap',
};

export default TypingDrill;
