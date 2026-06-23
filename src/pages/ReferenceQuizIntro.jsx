import { useState } from 'react';
import '../App.css';
import { TRANSLATIONS_CONCISE } from './components/constants';
import { map } from '../BookIDMap';

function ReferenceQuizIntro({ translation, setTranslation, onStart }) {
  const [book, setBook] = useState('ANY');
  const [chapter, setChapter] = useState('');
  const [mode, setMode] = useState('multiple-choice');

  // Format book names nicely
  const uniqueBookKeys = [...new Set(map.keys())].filter(k => !k.includes('song of')); // keep simple ones
  const bookOptions = uniqueBookKeys.map(k => {
    return {
      key: map.get(k), // e.g. GEN
      label: k.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    };
  });
  // Deduplicate by key
  const uniqueOptions = [];
  const seenKeys = new Set();
  for (const opt of bookOptions) {
    if (!seenKeys.has(opt.key)) {
      seenKeys.add(opt.key);
      uniqueOptions.push(opt);
    }
  }

  function handleStart() {
    let finalChapter = chapter.trim() ? chapter.trim() : 'ANY';
    // If book is ANY, chapter must be ANY
    if (book === 'ANY') {
      finalChapter = 'ANY';
    }
    onStart(book, finalChapter, mode);
  }

  return (
    <div className="drill-intro-wrapper">
      <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px'}}>
        <div style={{flex: 1, minWidth: '200px'}}>
          <p className="label-text">Select Book</p>
          <select value={book} onChange={e => setBook(e.target.value)} className="select" style={{width: '100%', padding: '12px'}}>
            <option value="ANY">Any Book (Random)</option>
            {uniqueOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{flex: 1, minWidth: '150px'}}>
          <p className="label-text">Select Chapter</p>
          <input 
            type="number" 
            value={chapter} 
            onChange={e => setChapter(e.target.value)} 
            placeholder="Any" 
            className="input" 
            style={{width: '100%', boxSizing: 'border-box'}}
            disabled={book === 'ANY'}
          />
        </div>
      </div>

      <div style={{marginBottom: '24px'}}>
        <p className="label-text">Select Translation</p>
        <select
          value={translation}
          className="select"
          style={{width: '100%', padding: '12px'}}
          onChange={e => setTranslation(e.target.value)}
        >
          {Object.entries(TRANSLATIONS_CONCISE).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <p className="label-text" style={{ marginBottom: '10px' }}>Quiz Mode</p>
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px', width: '100%', flexWrap: 'wrap'}}>
        <button 
          className={`btn-modern ${mode === 'multiple-choice' ? 'btn-dark' : 'btn-muted'}`} 
          style={{flex: 1, margin: 0, minWidth: '100px'}}
          onClick={() => setMode('multiple-choice')}
        >Multiple Choice</button>
        <button 
          className={`btn-modern ${mode === 'short-answer' ? 'btn-dark' : 'btn-muted'}`} 
          style={{flex: 1, margin: 0, minWidth: '100px'}}
          onClick={() => setMode('short-answer')}
        >Short Answer</button>
        <button 
          className={`btn-modern ${mode === 'flashcard' ? 'btn-dark' : 'btn-muted'}`} 
          style={{flex: 1, margin: 0, minWidth: '100px'}}
          onClick={() => setMode('flashcard')}
        >Flashcard</button>
      </div>

      <button
        className="btn-modern btn-dark"
        onClick={handleStart}
        style={{width: '100%'}}
      >
        Start Quiz
      </button>
    </div>
  );
}

export default ReferenceQuizIntro;
