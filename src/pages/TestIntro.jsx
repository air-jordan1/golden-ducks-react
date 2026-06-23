import { useState } from 'react';
import '../App.css';

function TestIntro({ availableVerses, loading, onStart }) {
  const maxQ = availableVerses.length;
  const [questionsCount, setQuestionsCount] = useState(Math.min(20, maxQ));
  const [answerWith, setAnswerWith] = useState('Both');
  const [types, setTypes] = useState({
    trueFalse: true,
    multipleChoice: true,
    written: false,
  });

  function handleStart() {
    if (questionsCount < 1 || questionsCount > maxQ) return;
    if (!types.trueFalse && !types.multipleChoice && !types.written) {
      alert("Please select at least one question type.");
      return;
    }

    const config = {
      count: parseInt(questionsCount, 10),
      answerWith, // 'Reference', 'Text', 'Both'
      types,
      pool: availableVerses,
    };
    onStart(config);
  }

  if (loading) {
    return (
      <div className="modern-card">
        <p className="loading-text">Loading your drill history...</p>
      </div>
    );
  }

  if (maxQ === 0) {
    return (
      <div className="modern-card">
        <h2 style={{ margin: '0 0 16px' }}>No Data Available</h2>
        <p>You haven't completed any drills yet. Complete some drills to unlock the Test Module!</p>
      </div>
    );
  }

  return (
    <div className="modern-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px' }}>Set up your test</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e8ddd4', paddingBottom: '16px' }}>
        <span style={{ fontWeight: '600', fontSize: '16px' }}>Questions <span style={{ color: '#b8a898', fontWeight: 'normal', fontSize: '14px' }}>(max {maxQ})</span></span>
        <input 
          type="number" 
          className="input" 
          style={{ width: '80px', textAlign: 'center', padding: '8px' }} 
          value={questionsCount}
          onChange={e => setQuestionsCount(e.target.value)}
          min={1}
          max={maxQ}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e8ddd4', paddingBottom: '16px' }}>
        <span style={{ fontWeight: '600', fontSize: '16px' }}>Answer with</span>
        <select 
          className="select" 
          style={{ padding: '8px 12px', minWidth: '120px' }}
          value={answerWith}
          onChange={e => setAnswerWith(e.target.value)}
        >
          <option value="Both">Both</option>
          <option value="Reference">Reference</option>
          <option value="Text">Verse Text</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px', color: '#1a1209' }}>True/False</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={types.trueFalse} onChange={e => setTypes({...types, trueFalse: e.target.checked})} />
          <span className="slider round"></span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px', color: '#1a1209' }}>Multiple choice</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={types.multipleChoice} onChange={e => setTypes({...types, multipleChoice: e.target.checked})} />
          <span className="slider round"></span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '16px', color: '#1a1209' }}>Written</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={types.written} onChange={e => setTypes({...types, written: e.target.checked})} />
          <span className="slider round"></span>
        </label>
      </div>

      <button className="btn-modern btn-dark" style={{ width: '100%', padding: '16px', fontSize: '16px' }} onClick={handleStart}>
        Start test
      </button>

      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .2s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .2s;
        }
        input:checked + .slider {
          background-color: #111827;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .slider.round {
          border-radius: 24px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

export default TestIntro;
