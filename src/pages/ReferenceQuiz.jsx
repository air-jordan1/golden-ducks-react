import { useState, useEffect } from 'react';
import '../App.css';
import HelpModal from '../components/HelpModal';
import ReferenceQuizIntro from './ReferenceQuizIntro';
import ReferenceQuizRunning from './ReferenceQuizRunning';
import { useUser } from '../context/UserContext';
import { STATES } from './components/constants.js';

function ReferenceQuiz() {
  const [state, setState] = useState(STATES.INTRO);
  const [translation, setTranslation] = useState('KJV');
  const [book, setBook] = useState('ANY');
  const [chapter, setChapter] = useState('ANY');
  const [quizMode, setQuizMode] = useState('multiple-choice');
  const { profile } = useUser();

  // set the translation based on profile
  useEffect(() => {
    if (profile?.preferredTranslation) {
      setTranslation(profile.preferredTranslation);
    }
  }, [profile?.preferredTranslation]);

  function handleStart(selectedBook, selectedChapter, selectedMode) {
    setBook(selectedBook);
    setChapter(selectedChapter);
    setQuizMode(selectedMode);
    setState(STATES.RUNNING);
  }

  function handleBack() {
    setState(STATES.INTRO);
  }

  return (
    <div className="page-container">
      <div className="modern-card drill-card" style={{ marginTop: '20px' }}>
        <HeaderArea />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {state === STATES.INTRO && (
            <ReferenceQuizIntro
              translation={translation}
              setTranslation={setTranslation}
              onStart={handleStart}
            />
          )}
          {state === STATES.RUNNING && (
            <ReferenceQuizRunning
              translation={translation}
              book={book}
              chapter={chapter}
              quizMode={quizMode}
              onBack={handleBack}
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
      <h1 className="title">Reference Quiz</h1>
      <p className="subtitle">Test your Scripture knowledge in reverse.</p>
      <div style={{ position: 'absolute', top: 0, right: 0 }}>
        <HelpModal title="Reference Quiz Instructions">
          <p>Read the verse and try to identify its reference!</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Multiple Choice:</strong> Select the correct reference from 4 options.</li>
            <li><strong>Short Answer:</strong> Type out the reference yourself (e.g. "John 3:16").</li>
          </ul>
          <p>You can filter the quiz to a specific book or chapter if you want to focus your studying.</p>
        </HelpModal>
      </div>
    </div>
  );
}

export default ReferenceQuiz;
