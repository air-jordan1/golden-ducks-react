import { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import TypingDrillIntro from './TypingDrillIntro';
import TypingDrillRunning from './TypingDrillRunning';
import TypingDrillResults from './TypingDrillResults';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { maxLevel, STATES, COMPLETION_THRESHOLD } from './components/constants.js';
import { parseReference, parsedRefToID, fetchPassage } from '../Passage';

// Normalize text to a common format for comparison (lowercase, remove punctuation, trim)
function norm(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                   // Decompose accented characters (built in normalize function)
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritical marks
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Longest Common Subsequence (LCS) accuracy
function lcsAccuracy(targetWords, typedWords) {
  const n = targetWords.length;
  const m = typedWords.length;
  if (!n) return 0;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = targetWords[i - 1] === typedWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.round((dp[n][m] / n) * 100);
}

function calcAccuracyDefault(typed, target) {
  return lcsAccuracy(
    norm(target).split(/\s+/).filter(Boolean),
    norm(typed).split(/\s+/).filter(Boolean)
  );
}

function calcAccuracyOverlay(typed, target) {
  return lcsAccuracy(
    target.split(/\s+/).filter(Boolean),
    typed.split(/\s+/).filter(Boolean)
  );
}

// Converts a string like "John 3:16" to a safe string like "john_3_16" for 
// easy behind the scenes storage and lookup of progress
function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
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
  const [drillMode, setDrillMode] = useState('simple');
  const { finalTranscript, listening, resetTranscript } = useSpeechRecognition();

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
    SpeechRecognition.stopListening();
    setIsRunning(false);
    const val = inputRef.current.value;
    let acc;
    if(drillMode === 'simple') {
      
      acc = calcAccuracyDefault(val, currentPassage);
    }
    if(drillMode === 'overlay') {
      acc = calcAccuracyOverlay(val, currentPassage);
    }

    setUserInput(val);
    setAccuracy(acc);
    const completed = acc >= COMPLETION_THRESHOLD;
    setLevelCompleted(completed);
    setState(STATES.RESULTS);

    const user = auth.currentUser;
    if (user) {
      try {
        const existing = await getDocs(
          query(collection(db, "drillResults"),
            where("userId", "==", user.uid),
            where("reference", "==", currentReference))
        );

        const existingBest = !existing.empty ? (existing.docs[0].data().accuracy ?? 0) : -1;

        if (acc > existingBest) {
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
        }

        if (completed) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const verseProgress = userSnap.exists() ? (userSnap.data().verseProgress || {}) : {};
          const key = getProgressKey(currentReference);

          if (currentLevel > (verseProgress[key] || 0)) {
            await updateDoc(userRef, { [`verseProgress.${key}`]: currentLevel });
          }

          if (currentLevel === maxLevel && acc === 100) {
            await updateDoc(userRef, { memorizedVerses: arrayUnion(currentReference) });
          }
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
      <div className="modern-card drill-card" style={{ marginTop: '20px' }}>
        <HeaderArea />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {state === STATES.INTRO && (
            <TypingDrillIntro
              onStart={handleStart}
              translation={translation}
              setTranslation={setTranslation}
              setDrillMode={setDrillMode}
              drillMode={drillMode}
              initialReference={currentReference}
              initialPassage={currentPassage}
              initialLevel={currentLevel}
            />
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
              drillMode={drillMode}
              finalTranscript={finalTranscript}
              listening={listening}
              resetTranscript={resetTranscript}
              translation={translation} 
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
              normalize={norm}
            />
          )}
        </div>
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

export default TypingDrill;
