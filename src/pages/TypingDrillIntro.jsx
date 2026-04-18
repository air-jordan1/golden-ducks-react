import { useState } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { parseReference, fetchPassage } from '../Passage';

const maxLevel = 4;

const levelDescriptions = [
    { level: 1, label: 'Level 1', desc: 'Full verse shown — type it out' },
    { level: 2, label: 'Level 2', desc: '30% of words hidden — fill in the blanks' },
    { level: 3, label: 'Level 3', desc: '66% of words hidden — fill in the blanks' },
    { level: maxLevel, label: `Level ${maxLevel}`, desc: 'No verse shown — type from memory' },
  ];

// Converts a string like "John 3:16" to a safe string like "john_3_16" for 
// easy behind the scenes storage and lookup of progress
function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
}

// Prompt and setup screen
function TypingDrillIntro({ onStart, translation }) {
  const [reference, setReference] = useState('');
  const [fetchedText, setFetchedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [verseProgress, setVerseProgress] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);

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
      const text = await fetchPassage(parsed, translation);
      setFetchedText(text);
      loadProgress(reference.trim());
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

  return (
    <div style={{ width: '100%' }}>
      <p className="label-text" style={{ marginBottom: '8px' }}>Verse reference</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={reference}
          onChange={e => { setReference(e.target.value); setFetchedText(''); setError(''); setVerseProgress(0); }}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. John 3:16, John 1:1-7, Proverbs 2"
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
          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>{fetchedText}</p>
          </div>

          {!progressLoading && (
            <p className="label-text" style={{ marginBottom: '12px' }}>
              {verseProgress > 0
                ? `Your progress: Level ${verseProgress} completed`
                : 'No progress recorded for this verse yet'}
            </p>
          )}

          <p className="label-text" style={{ marginBottom: '10px' }}>Select a level</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {levelDescriptions.map(({ level, label, desc }) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #111827' : '2px solid #e5e7eb',
                    backgroundColor: isSelected ? '#f9f9f9' : '#f9fafb',
                    color: isSelected ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontWeight: '700', fontSize: '15px', minWidth: '60px' }}>{label}</span>
                  <span style={{ fontSize: '14px', opacity: 0.85 }}>{desc}</span>
                  {verseProgress >= level && (
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: isSelected ? '#86efac' : '#10b981', fontWeight: '600' }}>
                      Completed
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', width: '100%' }}
            onClick={() => onStart(fetchedText, reference.trim(), selectedLevel)}
          >
            Start Level {selectedLevel}
          </button>
        </>
      )}
    </div>
  );
}

export default TypingDrillIntro;