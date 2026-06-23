import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, setDoc, increment } from "firebase/firestore";
import HelpModal from '../components/HelpModal';
import TypingDrillIntro from './TypingDrillIntro';
import TypingDrillRunning from './TypingDrillRunning';
import TypingDrillResults from './TypingDrillResults';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { maxLevel, STATES, COMPLETION_THRESHOLD } from './components/constants.js';
import { parseReference, fetchPassage } from '../Passage';
import { norm, calcAccuracyDefault, calcAccuracyOverlay, getProgressKey, getMissedWords } from '../utils/textProcessing';
import { useUser } from '../context/UserContext';
import { calculateNextReview } from '../utils/srs';
import { checkAndAwardAchievements } from '../utils/achievements';

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
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [drillMode, setDrillMode] = useState('simple');
  const { finalTranscript, listening, resetTranscript } = useSpeechRecognition();
  const { profile } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const drillList = location.state?.list || null;
  const [currentListIndex, setCurrentListIndex] = useState(0);
  const hasStartedList = useRef(false);

  useEffect(() => {
    if (drillList && drillList.length > 0 && !hasStartedList.current) {
      hasStartedList.current = true;
      startListDrill(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillList, translation]);

  async function startListDrill(index) {
    if (index >= drillList.length) {
      handleRestart();
      return;
    }
    const ref = drillList[index];
    try {
      const parsed = parseReference(ref);
      if (!parsed) { throw new Error("Invalid ref: " + ref); }
      const text = await fetchPassage(parsed, translation);
      setCurrentListIndex(index);
      
      let targetLevel = 1;
      if (profile && profile.verseProgress) {
        const normalizedRef = ref.trim().replace(/\b[a-zA-Z]/g, c => c.toUpperCase());
        const key = getProgressKey(normalizedRef);
        targetLevel = profile.verseProgress[key] || 1;
        if (targetLevel < 1) targetLevel = 1;
      }
      
      handleStart(text, ref, targetLevel);
    } catch (e) {
      console.error(e);
      handleRestart();
    }
  }

  function handleNextListVerse() {
    startListDrill(currentListIndex + 1);
  }

  // set the translation based on profile
  useEffect(() => {
    if (profile?.preferredTranslation) {
      setTranslation(profile.preferredTranslation);
    }
  }, [profile?.preferredTranslation]);

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
    } else if(drillMode === 'overlay') {
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
          await addDoc(collection(db, "drillResults"), {
            userId: user.uid,
            passage: currentPassage,
            reference: currentReference,
            timeTaken: time,
            accuracy: acc,
            level: currentLevel,
            translation: translation,
            missedWords: getMissedWords(val, currentPassage),
            completedAt: new Date()
          });

          // Also increment drillsToday
          await updateDoc(doc(db, "users", user.uid), {
            drillsToday: increment(1)
          });
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

          // Gamification
          const wordsCount = currentPassage.split(' ').length;
          const wpm = Math.round((wordsCount / (time || 1)) * 60);
          await checkAndAwardAchievements(user.uid, userSnap.data(), {
            wpm,
            accuracy: acc,
            isDailyChallenge: isDailyChallenge && currentLevel === 4 // Only award daily challenge if completed on level 4
          });

          // If daily challenge completed on level 4, mark in profile
          if (isDailyChallenge && currentLevel === 4) {
            await updateDoc(userRef, { dailyChallengeCompletedDate: new Date().toISOString().split('T')[0] });
          }

          // SRS Logic
          const progressDocRef = doc(db, "verseProgress", `${user.uid}_${key}`);
          const progSnap = await getDoc(progressDocRef);
          let currentSRSLevel = 0;
          if (progSnap.exists()) {
            currentSRSLevel = progSnap.data().srsLevel || 0;
          }
          const { newLevel, nextReviewDate } = calculateNextReview(currentSRSLevel, acc);
          await setDoc(progressDocRef, {
            userId: user.uid,
            reference: currentReference,
            srsLevel: newLevel,
            nextReviewDate,
            lastPracticed: new Date().toISOString()
          }, { merge: true });
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
              onStart={(text, ref, targetLevel) => {
                if (location.state?.isDailyChallenge) {
                  setIsDailyChallenge(true); // Save state when drill starts
                }
                handleStart(text, ref, targetLevel);
              }}
              translation={translation}
              setTranslation={setTranslation}
              setDrillMode={setDrillMode}
              drillMode={drillMode}
              initialReference={location.state?.dailyChallengeReference || currentReference}
              initialPassage={currentPassage}
              initialLevel={location.state?.isDailyChallenge ? 1 : currentLevel}
            />
          )}
          {state === STATES.RUNNING && (
            <TypingDrillRunning
              time={time}
              inputRef={inputRef}
              handleKeyDown={handleKeyDown}
              handleSubmit={handleSubmit}
              currentPassage={currentPassage}
              currentReference={currentReference}
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
              hasNextVerse={drillList && currentListIndex < drillList.length - 1}
              onNextVerse={handleNextListVerse}
              customFooter={isDailyChallenge && currentLevel < 4 && levelCompleted ? (
                <button className="btn-modern btn-dark" onClick={handleNextLevel}>Next Level (Level {currentLevel + 1})</button>
              ) : isDailyChallenge && currentLevel === 4 && levelCompleted ? (
                <button className="btn-modern btn-success" onClick={() => navigate('/welcome')}>Back to Dashboard</button>
              ) : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderArea() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
      <h1 className="title">Typing Drill</h1>
      <p className="subtitle">Test your speed and accuracy.</p>
      <div style={{ position: 'absolute', top: 0, right: 0 }}>
        <HelpModal title="Typing Drill Instructions">
          <p><strong>Levels:</strong></p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Level 1:</strong> Full verse shown.</li>
            <li><strong>Level 2:</strong> 30% of words hidden.</li>
            <li><strong>Level 3:</strong> 66% of words hidden.</li>
            <li><strong>Level 4:</strong> Type entirely from memory.</li>
          </ul>
          <p><strong>Drill Modes:</strong></p>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Normal:</strong> Type the entire passage verbatim.</li>
            <li><strong>Overlay:</strong> The text is visually overlaid to help you type.</li>
          </ul>
        </HelpModal>
      </div>
    </div>
  );
}

export default TypingDrill;
