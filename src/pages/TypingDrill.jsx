import { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import TypingDrillIntro from './TypingDrillIntro';
import TypingDrillRunning from './TypingDrillRunning';
import TypingDrillResults from './TypingDrillResults';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { maxLevel, STATES, COMPLETION_THRESHOLD } from './components/constants.js';

// Parse the Scripture reference
function parseReference(ref) {
  const t = ref.trim();
  const bookSlug = (b) => b.toLowerCase().replace(/\s+/g, '-');

  // Verse range: "John 1:1-7"
  const rangeMatch = t.match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
  if (rangeMatch) return {
    type: 'range',
    book: bookSlug(rangeMatch[1]),
    chapter: rangeMatch[2],
    start: parseInt(rangeMatch[3]),
    end: parseInt(rangeMatch[4]),
  };

  // Single verse: "John 3:16"
  const verseMatch = t.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (verseMatch) return {
    type: 'verse',
    book: bookSlug(verseMatch[1]),
    chapter: verseMatch[2],
    verse: verseMatch[3],
  };

  // Full chapter: "Proverbs 2"
  const chapterMatch = t.match(/^(.+?)\s+(\d+)$/);
  if (chapterMatch) return {
    type: 'chapter',
    book: bookSlug(chapterMatch[1]),
    chapter: chapterMatch[2],
  };

  return null;
}

function parsedRefToID(parsed) {
  let id = '';
  const book = map.get(parsed.book);
  const chapter = parsed.chapter;

  if (parsed.type === 'range') {
    id = `${book}.${chapter}.${parsed.start}-${book}.${chapter}.${parsed.end}`;
  }
  if (parsed.type === 'verse') {
    id = `${book}.${chapter}.${parsed.verse}`;
  }
  if (parsed.type === 'chapter') {
    id = `${book}.${chapter}`;
  }

  return id;
}

// Fetch the passage from the parsed reference
async function fetchPassage(parsed, translation) {
  // const base = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-${translation}/books/${parsed.book}/chapters/${parsed.chapter}`;

  const bibleId = await getTranslationId(translation);
  const base = `https://rest.api.bible/v1/bibles/${bibleId}`;
  const modifiers = `?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`
  const id = parsedRefToID(parsed);

  if (parsed.type === 'verse') {
    const res = await fetch(`${base}/verses/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '').trim();
  }

  if (parsed.type === 'range') {
    const res = await fetch(`${base}/passages/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '').trim();
  }

  if (parsed.type === 'chapter') {
    const res = await fetch(`${base}/chapters/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '').trim();
  }

  throw new Error();
}

// Normalize text to a common format for comparison (lowercase, remove punctuation, trim)
function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

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
    normalize(target).split(/\s+/).filter(Boolean),
    normalize(typed).split(/\s+/).filter(Boolean)
  );
}

function calcAccuracyOverlay(typed, target) {
  const normW = w => w.toLowerCase().replace(/[^\w]/g, '');
  return lcsAccuracy(
    target.split(/\s+/).filter(Boolean).map(normW),
    typed.split(/\s+/).filter(Boolean).map(normW)
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
