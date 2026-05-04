import '../App.css';

const maxLevel = 4;
const COMPLETION_THRESHOLD = 90;

function buildDiff(userInput, target, normalize) {
  const targetWords = target.trim().split(/\s+/).filter(Boolean);
  const typedWords = normalize(userInput).split(/\s+/).filter(Boolean);
  const n = targetWords.length;
  const m = typedWords.length;

  // Build LCS table
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (normalize(targetWords[i - 1]) === normalize(typedWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build aligned result.
  // When both a target word and a typed word are unmatched at the same position,
  // treat it as a substitution (wrong) rather than separate missing + extra.
  const result = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(targetWords[i - 1]) === normalize(typedWords[j - 1])) {
      result.unshift({ word: targetWords[i - 1], typed: typedWords[j - 1], status: 'correct' });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i - 1][j] === dp[i][j - 1]) {
      // Neither direction advances the LCS — treat as a substitution (wrong)
      result.unshift({ word: targetWords[i - 1], typed: typedWords[j - 1], status: 'wrong' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] > dp[i - 1][j])) {
      j--; // extra typed word with no target match
    } else {
      result.unshift({ word: targetWords[i - 1], typed: null, status: 'missing' });
      i--;
    }
  }
  return result;
}

function WordDiff({userInput, target, normalize }) {
  const diff = buildDiff(userInput, target, normalize);
  const accountedForCount = diff.filter(d => d.status === 'correct' || d.status === 'wrong').length;
  const typedWordCount = userInput.trim().split(/\s+/).filter(Boolean).length;
  const extraCount = Math.max(0, typedWordCount - accountedForCount);

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

function TypingDrillResults(params) {
  const accuracyColor = params.accuracy >= 90 ? '#10b981' : params.accuracy >= 70 ? '#f59e0b' : '#ef4444';
  const diff = buildDiff(params.userInput, params.currentPassage, params.normalize);
  const correctCount = diff.filter(d => d.status === 'correct').length;
  const totalCount = params.currentPassage.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="title" style={{ fontSize: '24px', marginBottom: '8px' }}>Results</h2>
      <p className="label-text" style={{ marginBottom: '20px' }}>Level {params.level}</p>

      {params.levelCompleted ? (
        <div style={{ backgroundColor: '#d1fae5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: '600', fontSize: '15px' }}>
            Level {params.level} completed!{' '}
            {params.level < maxLevel ? `Try Level ${params.level + 1} next.` : 'You have this verse memorized!'}
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
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', margin: 0 }}>{params.time}s</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Accuracy</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: accuracyColor, margin: 0 }}>{params.accuracy}%</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '12px', flex: 1 }}>
          <p className="label-text" style={{ margin: '0 0 4px 0' }}>Words</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1209', margin: 0 }}>
            {correctCount}<span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>/{totalCount}</span>
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left' }}>
        <p className="label-text" style={{ marginBottom: '8px' }}>Your input</p>
        <p style={{ margin: 0, color: '#374151', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {params.userInput.trim() || <em style={{ color: '#9ca3af' }}>Nothing typed</em>}
        </p>
      </div>

      <WordDiff userInput={params.userInput} target={params.currentPassage} normalize={params.normalize} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn-modern" style={{ width: '100%' }} onClick={params.onRetry}>
          Try again
        </button>
        {params.levelCompleted && params.level < maxLevel && (
          <button
            className="btn-modern"
            style={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', width: '100%' }}
            onClick={params.onNextLevel}
          >
            Advance to Level {params.level + 1}
          </button>
        )}
        <button className="btn-modern" style={{ width: '100%' }} onClick={params.onRestart}>
          Try a Different Verse
        </button>
      </div>
    </div>
  );
}

export default TypingDrillResults;
