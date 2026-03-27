import { useEffect, useState } from 'react';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "../App.css";
import BackButton from "./components/BackButton";

const TRANSLATIONS = {
  kjv: 'KJV — King James Version',
  asv: 'ASV — American Standard Version',
};

function Settings() {
  const [translation, setTranslation] = useState('kjv');
  const [previewText, setPreviewText] = useState('Loading preview...');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.email))
      .then(snap => {
        if (snap.exists() && snap.data().preferredTranslation) {
          setTranslation(snap.data().preferredTranslation);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setPreviewText('Loading preview...');
    fetch(`https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-${translation}/books/romans/chapters/5/verses/8.json`)
      .then(res => res.json())
      .then(data => setPreviewText(data.text))
      .catch(() => setPreviewText('Could not load preview.'));
  }, [translation]);

  const handleChange = async (e) => {
    const val = e.target.value;
    setTranslation(val);
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.email), { preferredTranslation: val });
    } catch (err) {
      console.error("Error saving translation:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="modern-card">
        <BackButton />

        <h1 className="title">Settings</h1>
        <p className="subtitle">Translation {saving && '— Saving...'}</p>

        <select
          value={translation}
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
