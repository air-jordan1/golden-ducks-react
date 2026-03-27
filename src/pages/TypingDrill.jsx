import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import BackButton from "./components/BackButton";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore";

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

function calcAccuracy(typed, target) {
  if (!target.length) return 0;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / target.length) * 100);
}

function TypingDrill() {
  const [state, setState] = useState(STATES.INTRO);
  const [userInput, setUserInput] = useState('');
  const [currentPassage, setCurrentPassage] = useState('');
  const [currentReference, setCurrentReference] = useState('');
  const [translation, setTranslation] = useState('kjv');
  const [accuracy, setAccuracy] = useState(0);
  const inputRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.email))
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

  function handleStart(passageText, reference) {
    setCurrentPassage(passageText);
    setCurrentReference(reference);
    setState(STATES.RUNNING);
  }

  async function handleSubmit() {
    setIsRunning(false);
    const val = inputRef.current.value;
    const acc = calcAccuracy(val, currentPassage);
    setUserInput(val);
    setAccuracy(acc);
    setState(STATES.RESULTS);

    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, "drillResults"), {
        userId: user.email,
        passage: currentPassage,
        reference: currentReference,
        userInput: val,
        timeTaken: time,
        accuracy: acc,
        translation,
        completedAt: new Date(),
      });

      if (acc === 100 && currentReference) {
        await updateDoc(doc(db, "users", user.email), {
          memorizedVerses: arrayUnion(currentReference),
        });
      }
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
              accuracy={accuracy}
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
            onClick={() => onStart(fetchedText, reference)}
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
    <div style={{ width: '100%' }}>
      <p className="label-text" style={{ marginBottom: '8px', textAlign: 'center' }}>Time: {props.time}s</p>

      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#374151', fontSize: '16px', lineHeight: '1.6' }}>
          {props.currentPassage}
        </p>
      </div>

      <InputField
        inputRef={props.inputRef}
        handleKeyDown={props.handleKeyDown}
        handleSubmit={props.handleSubmit}
      />

      <button className="btn-modern" onClick={props.handleSubmit} style={{ marginTop: '16px', width: '100%' }}>
        Submit Result
      </button>
    </div>
  );
}

function TypingDrillResults(props) {
  const accuracyColor = props.accuracy >= 90 ? '#10b981' : props.accuracy >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '24px' }}>Results</h2>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Time</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', margin: 0 }}>{props.time}s</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Accuracy</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: accuracyColor, margin: 0 }}>{props.accuracy}%</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
        <p className="label-text">You typed:</p>
        <p style={{ fontSize: '15px', color: '#111827', margin: '0 0 16px 0' }}>"{props.userInput}"</p>
        <p className="label-text">Target:</p>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>"{props.currentPassage}"</p>
      </div>
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
    <textarea
      ref={props.inputRef}
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
    />
  );
}

export default TypingDrill;
