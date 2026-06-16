import { useState, useEffect } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { parseReference, fetchPassage } from '../Passage';
import { maxLevel, TRANSLATIONS_CONCISE, levelDescriptions } from './components/constants';

function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
}

function normalizeReference(ref) {
  // Capitalize first letter of each word so "genesis 1:1" and "Genesis 1:1" are treated identically
  return ref.trim().replace(/\b[a-zA-Z]/g, c => c.toUpperCase());
}

function TypingDrillIntro({ onStart, translation, setTranslation, setDrillMode, drillMode, initialReference, initialPassage, initialLevel }) {
  const [reference, setReference] = useState(initialReference || '');
  const [fetchedText, setFetchedText] = useState(initialPassage || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(initialLevel || 1);
  const [verseProgress, setVerseProgress] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);

  // Checks progress on page load
  useEffect(() => {
    if (initialReference) loadProgress(normalizeReference(initialReference));
  }, []);

  const handleLookup = async () => {
    const parsed = parseReference(reference);
    if (!parsed) {
      setError('Something is wrong with the reference. Format like this: "John 3:16", "John 1:1-7", or "Proverbs 2"');
      return;
    }
    setError('');
    setFetchedText('');
    setLoading(true);
    try {
      const text = await fetchPassage(parsed, param.translation);
      setFetchedText(text);
      loadProgress(normalizeReference(reference));
    } catch {
      setError('Passage not found. Check the reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (ref) => {
    const user = auth.currentUser;
    if (!user) return;
    setProgressLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const key = getProgressKey(ref);
        const progress = snap.data().verseProgress || {};
        setVerseProgress(progress[key] || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProgressLoading(false);
    }
  };

  function TranslationSelector() {
    return (
      <select
        name="test"
        value={param.translation}
        className="select"
        onChange={e => { setTranslation(e.target.value); handleLookup(); }}
      >
        {Object.entries(TRANSLATIONS_CONCISE).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="drill-intro-wrapper">
      <p className="label-text">Verse reference</p>
      <div className="verse-reference-input-group">
        <input
          type="text"
          value={reference}
          onChange={e => { setReference(e.target.value); setFetchedText(''); setError(''); setVerseProgress(0); }}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. John 3:16, John 1:1-7, Proverbs 2"
          className="input"
        />
        <TranslationSelector />
        <button className="btn-modern" onClick={handleLookup} disabled={loading || !reference.trim()}>
          {loading ? '...' : 'Look up'}
        </button>
      </div>

      {error && <p className="intro-error">{error}</p>}

      {fetchedText && (
        <>
          <div className="verse-preview">
            <p>{fetchedText}</p>
          </div>

          {!progressLoading && (
            <p className="label-text" style={{ marginBottom: '12px' }}>
              {verseProgress > 0
                ? `Your progress: Level ${verseProgress} completed`
                : 'No progress recorded for this verse yet'}
            </p>
          )}

          <p className="label-text" style={{ marginBottom: '10px' }}>Select a level</p>
          <div className="level-selector">
            {levelDescriptions.map(({ level, label, desc }) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`level-btn${isSelected ? ' level-btn--selected' : ''}`}
                >
                  <span className="level-btn-label">{label}</span>
                  <span className="level-btn-desc">{desc}</span>
                  {verseProgress >= level && (
                    <span className="level-btn-completed">Completed</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="btn-modern btn-dark"
            onClick={() => onStart(fetchedText, normalizeReference(reference), selectedLevel)}
          >
            Start Level {selectedLevel} in {drillMode} mode
          </button>

          {drillMode === 'simple' && (
            <button className="btn-modern btn-muted" onClick={() => setDrillMode('overlay')}>
              Switch Mode
            </button>
          )}

          {drillMode === 'overlay' && (
            <button className="btn-modern btn-muted" onClick={() => setDrillMode('simple')}>
              Switch Mode
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default TypingDrillIntro;
