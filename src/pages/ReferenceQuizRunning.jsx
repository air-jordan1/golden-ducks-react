import { useState, useEffect, useRef } from 'react';
import '../App.css';
import { getRandomVerse, generateDistractors, parseReference } from '../Passage';

// Very loose string comparison for short answer mode
function isMatch(input, correct) {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(input) === normalize(correct);
}

function ReferenceQuizRunning({ translation, book, chapter, quizMode, onBack }) {
  const [loading, setLoading] = useState(true);
  const [verseData, setVerseData] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null); // { correct: boolean, message: string }
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    loadNextQuestion();
  }, []);

  async function loadNextQuestion() {
    setLoading(true);
    setFeedback(null);
    setUserInput('');
    try {
      // If user typed a chapter number like "3", we need to format it to bookId.chapterNumber if possible.
      // But getRandomVerse in Passage.js expects chapterId like JHN.3.
      // Wait, let's fix that logic: if chapter is a number, we prepend the book.
      let finalChapter = chapter;
      if (chapter !== 'ANY' && book !== 'ANY' && !chapter.includes('.')) {
        finalChapter = `${book}.${chapter}`;
      }

      const data = await getRandomVerse(translation, book, finalChapter);
      setVerseData(data);
      
      if (quizMode === 'multiple-choice') {
        setOptions(generateDistractors(data.reference));
      }
    } catch (err) {
      console.error(err);
      setFeedback({ correct: false, message: 'Failed to load verse. Please check your book/chapter filters.' });
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }

  function handleMultipleChoiceGuess(selectedRef) {
    if (selectedRef === verseData.reference) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  }

  function handleShortAnswerSubmit(e) {
    if (e) e.preventDefault();
    // Allow loose match (e.g. "john 3 16" == "John 3:16")
    // Let's also check if the parseReference works and matches
    const parsedInput = parseReference(userInput);
    const parsedCorrect = parseReference(verseData.reference);

    let correct = false;
    if (parsedInput && parsedCorrect) {
      if (parsedInput.book === parsedCorrect.book && 
          parsedInput.chapter === parsedCorrect.chapter && 
          parsedInput.verse === parsedCorrect.verse) {
        correct = true;
      }
    }

    if (correct || isMatch(userInput, verseData.reference)) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  }

  function handleCorrect() {
    setScore(s => s + 1);
    setStreak(s => s + 1);
    setFeedback({ correct: true, message: 'Correct!' });
    setTimeout(() => {
      loadNextQuestion();
    }, 1200);
  }

  function handleIncorrect() {
    setStreak(0);
    setFeedback({ correct: false, message: `Incorrect. The correct answer was: ${verseData?.reference}` });
  }

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="label-text">Score: {score}</span>
        <span className="label-text">Streak: {streak} 🔥</span>
      </div>

      <div className="drill-background" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <p style={{ color: '#6b5c4e', fontStyle: 'italic' }}>Loading next verse...</p>
        ) : verseData ? (
          <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#1a1209' }}>{verseData.text}</p>
        ) : null}
      </div>

      {!loading && verseData && !feedback && (
        <div style={{ marginTop: '24px' }}>
          {quizMode === 'multiple-choice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((opt, i) => (
                <button 
                  key={i} 
                  className="btn-modern btn-muted" 
                  style={{ width: '100%', textAlign: 'left', padding: '16px', fontSize: '16px' }}
                  onClick={() => handleMultipleChoiceGuess(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : quizMode === 'short-answer' ? (
            <form onSubmit={handleShortAnswerSubmit} style={{ display: 'flex', gap: '12px' }}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="e.g. John 3:16"
                className="input"
                style={{ flex: 1 }}
                autoFocus
              />
              <button type="submit" className="btn-modern btn-dark">Submit</button>
            </form>
          ) : quizMode === 'flashcard' ? (
            <button 
              className="btn-modern btn-dark" 
              onClick={() => setFeedback({ correct: false, isFlashcardReveal: true, message: `The reference is: ${verseData.reference}` })} 
              style={{ width: '100%' }}
            >
              Reveal Reference
            </button>
          ) : null}
        </div>
      )}

      {feedback && (
        <div className={`modern-card`} style={{ marginTop: '24px', padding: '16px', backgroundColor: feedback.correct ? '#e6f4ea' : (feedback.isFlashcardReveal ? '#f3f4f6' : '#fce8e6'), borderColor: feedback.correct ? '#34a853' : (feedback.isFlashcardReveal ? '#d1d5db' : '#ea4335') }}>
          <p style={{ margin: 0, color: feedback.correct ? '#137333' : (feedback.isFlashcardReveal ? '#374151' : '#c5221f'), fontWeight: 'bold' }}>
            {feedback.message}
          </p>
          {feedback.isFlashcardReveal ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="btn-modern" style={{ flex: 1, backgroundColor: '#34a853', color: 'white' }} onClick={handleCorrect}>I knew it</button>
              <button className="btn-modern" style={{ flex: 1, backgroundColor: '#ea4335', color: 'white' }} onClick={() => { setStreak(0); loadNextQuestion(); }}>I didn't know it</button>
            </div>
          ) : !feedback.correct ? (
            <button className="btn-modern btn-dark" onClick={loadNextQuestion} style={{ marginTop: '16px', width: '100%' }}>
              Next Question
            </button>
          ) : null}
        </div>
      )}

      <button className="btn-modern" onClick={onBack} style={{ marginTop: '24px', width: '100%' }}>End Quiz</button>
    </div>
  );
}

export default ReferenceQuizRunning;
