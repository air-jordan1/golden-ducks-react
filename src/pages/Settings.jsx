import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import BackButton from "./components/BackButton"; 

function Settings() {
  function TranslationController() {
    const selectorOptions = ['asv', 'gnv', 'kjv'];
    const [version, setVersion] = useState(selectorOptions[0]);
    const [selectedApi, setSelectedApi] = useState("");
    
    useEffect(() => { 
      const api = fetch("https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-" + version + "/books/john/chapters/3/verses/16.json")
      .then((response) => response.json())
      .then((data) => setSelectedApi(data.text))
      }, [version]);

    const handleSelection = (event) => {
      setVersion(event.target.value);
    };

    function DemoPassage() {
      return selectedApi;
    }

    return (
      <div className="page-container">
        <div className="modern-card">
          
          <BackButton />

          <h1 className="title">Settings</h1>
          <p className="subtitle">Change translation?</p>
          
          <select 
            onChange={handleSelection}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              fontSize: '16px',
              color: '#111827',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '24px',
              appearance: 'none',
              backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%236b7280"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
              backgroundSize: '20px',
            }}
          >
            {selectorOptions.map(api => <option key={api} value={api}>{api}</option>)}
          </select>
          
          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>
              <DemoPassage />
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <TranslationController />
  )
}


export default Settings;