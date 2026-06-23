import '../App.css';

function TestResults({ results, onRetake }) {
  const scorePercent = Math.round((results.score / results.total) * 100);
  
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <div className="modern-card" style={{ marginBottom: '32px', textAlign: 'center', padding: '40px' }}>
        <h2 style={{ fontSize: '32px', margin: '0 0 16px', color: scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#f59e0b' : '#ef4444' }}>
          {scorePercent}%
        </h2>
        <p style={{ fontSize: '18px', margin: '0 0 24px', color: '#6b5c4e' }}>
          You scored {results.score} out of {results.total} correct.
        </p>
        <button className="btn-modern btn-dark" style={{ padding: '12px 24px', width: 'auto' }} onClick={onRetake}>
          Take another test
        </button>
      </div>

      <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Review your answers</h3>

      {results.graded.map((q) => (
        <div key={q.id} className="modern-card" style={{ marginBottom: '16px', textAlign: 'left', borderLeft: `8px solid ${q.isCorrect ? '#10b981' : '#ef4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#6b5c4e', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            <span>{q.direction === 'Reference' ? 'Definition' : 'Term'}</span>
            <span style={{ color: q.isCorrect ? '#10b981' : '#ef4444' }}>{q.isCorrect ? 'Correct' : 'Incorrect'}</span>
          </div>
          
          <p style={{ fontSize: '16px', color: '#1a1209', marginBottom: '16px', lineHeight: '1.5' }}>
            {q.prompt}
          </p>
          
          {q.type === 'true-false' && (
            <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#6b5c4e', marginBottom: '16px' }}>
              Statement: {q.tfStatement}
            </p>
          )}

          <div style={{ backgroundColor: '#faf8f5', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#b8a898', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Answer</p>
            <p style={{ margin: 0, fontSize: '16px', color: q.isCorrect ? '#10b981' : '#ef4444', fontWeight: '500' }}>
              {q.userAns !== null && q.userAns !== undefined ? String(q.userAns) : "Skipped"}
            </p>
          </div>

          {!q.isCorrect && (
            <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#10b981', textTransform: 'uppercase', fontWeight: 'bold' }}>Correct Answer</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#047857', fontWeight: '500' }}>
                {q.type === 'true-false' ? String(q.tfIsCorrect) : q.correctAns}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TestResults;
