import { useState, useEffect } from 'react';
import '../App.css';
import { fetchPassage, parseReference, generateDistractors } from '../Passage';

function isMatch(input, correct) {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(input) === normalize(correct);
}

function TestRunning({ config, translation, onFinish, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { index: answerValue }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateTest() {
      try {
        const selectedRefs = [...config.pool].sort(() => Math.random() - 0.5).slice(0, config.count);
        
        const dataPromises = selectedRefs.map(async (ref) => {
          const parsed = parseReference(ref);
          let text = "Text unavailable";
          if (parsed) {
            text = await fetchPassage(parsed, translation);
          }
          return { reference: ref, text };
        });
        
        const rawData = await Promise.all(dataPromises);
        
        const availableTypes = [];
        if (config.types.trueFalse) availableTypes.push('true-false');
        if (config.types.multipleChoice) availableTypes.push('multiple-choice');
        if (config.types.written) availableTypes.push('written');
        
        const generated = rawData.map((d, index) => {
          const qType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          
          let direction = config.answerWith;
          if (direction === 'Both') {
            direction = Math.random() > 0.5 ? 'Reference' : 'Text';
          }
          
          const prompt = direction === 'Reference' ? d.text : d.reference;
          const correctAns = direction === 'Reference' ? d.reference : d.text;
          
          let options = null;
          let tfStatement = null;
          let tfIsCorrect = null;
          
          if (qType === 'multiple-choice') {
            if (direction === 'Reference') {
              options = generateDistractors(d.reference);
            } else {
              const others = rawData.filter(x => x.reference !== d.reference).map(x => x.text);
              others.sort(() => Math.random() - 0.5);
              const distractors = others.slice(0, 3);
              while(distractors.length < 3) distractors.push("No distractor available");
              options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);
            }
          } else if (qType === 'true-false') {
            tfIsCorrect = Math.random() > 0.5;
            if (tfIsCorrect) {
              tfStatement = correctAns;
            } else {
              if (direction === 'Reference') {
                tfStatement = generateDistractors(d.reference).find(x => x !== d.reference) || "Fake Ref";
              } else {
                const others = rawData.filter(x => x.reference !== d.reference).map(x => x.text);
                tfStatement = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : "Fake text";
              }
            }
          }

          return {
            id: index,
            type: qType,
            direction,
            prompt,
            correctAns,
            options,
            tfStatement,
            tfIsCorrect,
            rawReference: d.reference // to help with loose matching if needed
          };
        });

        setQuestions(generated);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    generateTest();
  }, [config, translation]);

  function handleAnswer(index, value) {
    setAnswers(prev => ({ ...prev, [index]: value }));
  }

  function handleSubmit() {
    // Grade the test
    let score = 0;
    const graded = questions.map((q) => {
      const userAns = answers[q.id];
      let isCorrect = false;

      if (q.type === 'true-false') {
        isCorrect = userAns === q.tfIsCorrect;
      } else if (q.type === 'multiple-choice') {
        isCorrect = userAns === q.correctAns;
      } else if (q.type === 'written') {
        if (!userAns) {
          isCorrect = false;
        } else if (q.direction === 'Reference') {
          // parse to check
          const parsedInput = parseReference(userAns);
          const parsedCorrect = parseReference(q.correctAns);
          if (parsedInput && parsedCorrect && 
              parsedInput.book === parsedCorrect.book && 
              parsedInput.chapter === parsedCorrect.chapter && 
              parsedInput.verse === parsedCorrect.verse) {
            isCorrect = true;
          } else if (isMatch(userAns, q.correctAns)) {
            isCorrect = true;
          }
        } else {
          // Direction is Text, just loose match
          isCorrect = isMatch(userAns, q.correctAns);
        }
      }

      if (isCorrect) score++;

      return {
        ...q,
        userAns,
        isCorrect
      };
    });

    onFinish({ score, total: questions.length, graded });
  }

  if (loading) {
    return (
      <div className="modern-card">
        <p className="loading-text" style={{ margin: '40px 0' }}>Generating test... (fetching verses)</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <button onClick={onCancel} className="btn-modern btn-muted" style={{ width: 'auto', padding: '8px 24px' }}>← Cancel Test</button>
      </div>
      
      {questions.map((q, i) => (
        <div key={q.id} className="modern-card" style={{ marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#6b5c4e', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            <span>{q.direction === 'Reference' ? 'Definition' : 'Term'}</span>
            <span>{i + 1} of {questions.length}</span>
          </div>
          
          <p style={{ fontSize: '18px', color: '#1a1209', marginBottom: '32px', lineHeight: '1.6' }}>
            {q.prompt}
          </p>

          <p style={{ fontSize: '14px', color: '#6b5c4e', fontWeight: 'bold', marginBottom: '12px' }}>Choose an answer</p>

          {q.type === 'multiple-choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {q.options.map(opt => (
                <button 
                  key={opt}
                  className={`btn-modern ${answers[q.id] === opt ? 'btn-dark' : 'btn-muted'}`}
                  style={{ textAlign: 'left', padding: '16px', margin: 0 }}
                  onClick={() => handleAnswer(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'true-false' && (
            <div>
              <div className="modern-card" style={{ backgroundColor: '#faf8f5', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '16px', color: '#1a1209' }}>{q.tfStatement}</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  className={`btn-modern ${answers[q.id] === true ? 'btn-dark' : 'btn-muted'}`}
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => handleAnswer(q.id, true)}
                >True</button>
                <button 
                  className={`btn-modern ${answers[q.id] === false ? 'btn-dark' : 'btn-muted'}`}
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => handleAnswer(q.id, false)}
                >False</button>
              </div>
            </div>
          )}

          {q.type === 'written' && (
            <input 
              type="text" 
              className="input" 
              placeholder="Type the answer" 
              style={{ width: '100%' }}
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
            />
          )}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button className="hero-secondary" style={{ fontSize: '14px' }} onClick={() => handleAnswer(q.id, null)}>Don't know?</button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button className="btn-modern btn-dark" style={{ padding: '16px 32px', width: 'auto' }} onClick={handleSubmit}>
          Submit test
        </button>
      </div>
    </div>
  );
}

export default TestRunning;
