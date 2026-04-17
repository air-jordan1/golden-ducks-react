import { useEffect, useState } from 'react';
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs, getPersistentCacheIndexManager, query, updateDoc, where } from "firebase/firestore";
import { getPreferredTranslation, setPreferredTranslation, getTranslationId } from '../User.js'
import "../App.css";

// holds translation options
const TRANSLATIONS = {
  ASV: 'ASV — American Standard Version',
  CSB: 'CSB - Christian Standard Bible',
  KJV: 'KJV — King James Version',
  NIV: 'NIV - New International Version',
  NLT: 'NLT - New Living Translation'
};

/**
 * Settings() React component
 * @returns 
 */
function Settings() {
  const [userSelection, setUserSelection] = useState(''); // user's selected translation
  const [previewText, setPreviewText] = useState(''); // romans 5:8 string
  const [saving, setSaving] = useState(false); // track saving of preferred translation

  // useEffect for intial page open
  useEffect(() => {
    getPreferredTranslation()
    .then(abbrev => setUserSelection(abbrev));
  }, []);

  // useEffect for updating verse preview
  useEffect(() => {
    setPreviewText('Loading preview...');
    if(userSelection == '') return;
    getTranslationId(userSelection)
    .then(id => fetch(`https://rest.api.bible/v1/bibles/${id}/verses/ROM.5.8?content-type=text&include-verse-numbers=false`, {
      headers: {
        'api-key': import.meta.env.VITE_BIBLE_API_KEY
      }
    }))
    .then(res => res.json())
    .then(data => setPreviewText(data.data.content))
    .catch(() => setPreviewText('Could not load preview.'));
  }, [userSelection]);

  /**
   * handleChange for saving user's selection
   * @param {*} e 
   * @returns 
   */
  const handleChange = async (e) => {
      const user = auth.currentUser;

      const val = e.target.value;
      setUserSelection(val);

      if (!user) return;
      setSaving(true);
      try {
        setPreferredTranslation(val);
      } catch (err) {
        console.error("Error saving translation:", err);
      } finally {
        setSaving(false);
      }
  };

  // return UI components
  return (
    <div className="page-container">
      <div className="modern-card settings-card">
        <h1 className="title">Settings</h1>
        <p className="subtitle">Translation {saving && '— Saving...'}</p>

        <select
          value={userSelection}
          onChange={handleChange}
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
          {Object.entries(TRANSLATIONS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <p className="label-text" style={{ marginBottom: '8px' }}>Preview — Romans 5:8</p>
        <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>{previewText}</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
