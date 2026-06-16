import '../App.css';
import { maxLevel, COMPLETION_THRESHOLD } from './components/constants.js';

function TypingDrillResults(param) {
  const accuracyColor = param.accuracy >= 90 ? '#10b981' : param.accuracy >= 70 ? '#f59e0b' : '#ef4444';
  const diff = buildDiff(param.userInput, param.currentPassage);
  const correctCount = diff.filter(d => d.status === 'correct').length;
  const totalCount = param.currentPassage.trim().split(/\s+/).filter(Boolean).length;

  function buildDiff(userInput, target) {
    const targetWords = target.trim().split(/\s+/).filter(Boolean);
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);
    return targetWords.map((word, i) => {
      const typed = typedWords[i];
      if (!typed) return { word, typed: null, status: 'missing' };
      if (param.normalize(typed) === param.normalize(word)) return { word, typed, status: 'correct' };
      return { word, typed, status: 'wrong' };
    });
  }

  function WordDiff({ userInput, target }) {
    
    const typedWordCount = userInput.trim().split(/\s+/).filter(Boolean).length;
    const targetWordCount = target.trim().split(/\s+/).filter(Boolean).length;
    const extraCount = Math.max(0, typedWordCount - targetWordCount);

    return (
      <div className="diff-container">
        <p className="label-text" style={{ marginBottom: '12px' }}>Word breakdown</p>
        <div className="diff-words">
          {diff.map(({ word, typed, status }, i) => (
            <span
              key={i}
              className={`diff-word diff-word--${status}`}
              title={status === 'wrong' && typed ? `You typed: "${typed}"` : undefined}
            >
              {word}
            </span>
          ))}
        </div>
        <div className="diff-legend">
          <span className="diff-legend-item diff-legend-item--correct">Correct</span>
          <span className="diff-legend-item diff-legend-item--wrong">Wrong</span>
          <span className="diff-legend-item diff-legend-item--missing">Missing</span>
          {extraCount > 0 && (
            <span className="diff-extra">
              +{extraCount} extra word{extraCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '8px' }}>Results</h2>
      <p className="label-text" style={{ marginBottom: '20px' }}>Level {param.level}</p>

      {param.levelCompleted ? (
        <div style={{ backgroundColor: '#d1fae5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: '600', fontSize: '15px' }}>
            Level {param.level} completed!{' '}
            {param.level < maxLevel ? `Try Level ${param.level + 1} next.` : 'You have this verse memorized!'}
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
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', margin: 0 }}>{param.time}s</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Accuracy</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: accuracyColor, margin: 0 }}>{param.accuracy}%</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Words</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1209', margin: 0 }}>
            {correctCount}<span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>/{totalCount}</span>
          </p>
        </div>
      </div>

      <WordDiff userInput={param.userInput} target={param.currentPassage} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn-modern" style={{ width: '100%' }} onClick={param.onRetry}>
          Try again
        </button>
        {param.levelCompleted && param.level < maxLevel && (
          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', width: '100%' }}
            onClick={param.onNextLevel}
          >
            Advance to Level {param.level + 1}
          </button>
        )}
        <button className="btn-modern" style={{ width: '100%' }} onClick={param.onRestart}>
          Try a Different Verse
        </button>
      </div>
    </div>
  );
}

export default TypingDrillResults;
