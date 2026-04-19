import '../App.css';

const maxLevel = 4;

const COMPLETION_THRESHOLD = 90;

// Converts a string like "John 3:16" to a safe string like "john_3_16" for 
// easy behind the scenes storage and lookup of progress
function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
}

// Results screen
function TypingDrillResults({ userInput, time, accuracy, currentPassage, level, levelCompleted, onRestart, onNextLevel, onRetry }) {
  const accuracyColor = accuracy >= 90 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '8px' }}>Results</h2>
      <p className="label-text" style={{ marginBottom: '20px' }}>Level {level}</p>

      {levelCompleted ? (
        <div style={{ backgroundColor: '#d1fae5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: '600', fontSize: '15px' }}>
            Level {level} completed! {level < maxLevel ? `Try Level ${level + 1} next.` : 'You have this verse memorized!'}
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
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', margin: 0 }}>{time}s</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Accuracy</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: accuracyColor, margin: 0 }}>{accuracy}%</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
        <p className="label-text">You typed:</p>
        <p style={{ fontSize: '15px', color: '#111827', margin: '0 0 16px 0' }}>"{userInput}"</p>
        <p className="label-text">Target:</p>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>"{currentPassage}"</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          className="btn-modern"
          style={{ width: '100%' }}
          onClick={onRetry}
        >
          Try again
        </button>
        {levelCompleted && level < maxLevel && (
          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', width: '100%' }}
            onClick={onNextLevel}
          >
            Advance to Level {level + 1}
          </button>
        )}
        <button
          className="btn-modern"
          style={{ width: '100%' }}
          onClick={onRestart}
        >
          Try a Different Verse
        </button>
      </div>
    </div>
  );
}

export default TypingDrillResults;
