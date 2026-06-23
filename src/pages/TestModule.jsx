import { useState, useEffect } from 'react';
import '../App.css';
import { useUser } from '../context/UserContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import TestIntro from './TestIntro';
import TestRunning from './TestRunning';
import TestResults from './TestResults';
import { STATES } from './components/constants.js';
import HelpModal from '../components/HelpModal';

function TestModule() {
  const { user, profile } = useUser();
  const [state, setState] = useState(STATES.INTRO);
  const [drilledVerses, setDrilledVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testConfig, setTestConfig] = useState(null);
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const q = query(collection(db, "drillResults"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const uniqueRefs = new Set();
        snap.forEach(d => {
          const data = d.data();
          if (data.reference) uniqueRefs.add(data.reference);
        });
        setDrilledVerses(Array.from(uniqueRefs));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  function handleStart(config) {
    setTestConfig(config);
    setState(STATES.RUNNING);
  }

  function handleFinish(finalResults) {
    setResults(finalResults);
    setState(STATES.RESULTS);
  }

  return (
    <div className="page-container" style={{ alignItems: 'flex-start', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="title" style={{ margin: 0 }}>Test Module</h1>
            <p className="subtitle" style={{ margin: 0 }}>Test yourself on verses you've previously drilled.</p>
          </div>
          <HelpModal title="Test Module Instructions">
            <p>This module generates a comprehensive test based on verses you've encountered in the past.</p>
            <p>You can adjust the number of questions, the format (True/False, Multiple Choice, Written), and whether you are prompted with the Verse Text or the Reference.</p>
          </HelpModal>
        </div>

        {state === STATES.INTRO && (
          <TestIntro 
            availableVerses={drilledVerses} 
            loading={loading} 
            onStart={handleStart} 
          />
        )}
        {state === STATES.RUNNING && (
          <TestRunning 
            config={testConfig} 
            translation={profile?.preferredTranslation || 'KJV'}
            onFinish={handleFinish} 
            onCancel={() => setState(STATES.INTRO)}
          />
        )}
        {state === STATES.RESULTS && (
          <TestResults 
            results={results} 
            onRetake={() => setState(STATES.INTRO)} 
          />
        )}
      </div>
    </div>
  );
}

export default TestModule;
