import { useEffect, useState } from 'react';
import { getTranslationId } from '../Passage.js';
import "../App.css";
import { TRANSLATIONS } from './components/constants.js';
import { useUser } from '../context/UserContext';
import HelpModal from '../components/HelpModal';

function Settings() {
  const { profile, updatePreferredTranslation } = useUser();
  const [userSelection, setUserSelection] = useState(''); // user's selected translation
  const [previewText, setPreviewText] = useState(''); // romans 5:8 string
  const [saving, setSaving] = useState(false); // track saving of preferred translation

  // useEffect for intial page open
  useEffect(() => {
    if (profile?.preferredTranslation) {
      setUserSelection(profile.preferredTranslation);
    }
  }, [profile?.preferredTranslation]);

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

  const handleChange = async (e) => {
      const val = e.target.value;
      setUserSelection(val);
      setSaving(true);
      try {
        await updatePreferredTranslation(val);
      } catch (err) {
        console.error("Error saving translation:", err);
      } finally {
        setSaving(false);
      }
  };

  // return UI components
  return (
    <div className="page-container">
      <div className="modern-card settings-card" style={{ position: 'relative' }}>
        <h1 className="title">Settings</h1>
        <p className="subtitle">Translation {saving && '— Saving...'}</p>
        
        <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
          <HelpModal title="Settings">
            <p><strong>Translations:</strong> Select your preferred Bible translation. This translation will be used as the default for all your Typing Drills and Lists.</p>
          </HelpModal>
        </div>

        <select value={userSelection} onChange={handleChange} className="settings-select">
          {Object.entries(TRANSLATIONS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <p className="label-text">Preview — Romans 5:8</p>
        <div className="verse-preview">
          <p>{previewText}</p>
        </div>
      </div>
      <p></p>
      <p className="copyright">Christian Standard Bible® and CSB® are federally registered trademarks of Holman Bible Publishers. All rights reserved. bhpublishinggroup.com</p>
      <p className="copyright">Holy Bible, New Living Translation, Copyright © 2014, Tyndale House Publishers. All rights reserved. tyndale.com</p>
      <p className="copyright">The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by Permission of Biblica, Inc.® All rights reserved worldwide. To learn more, visit http://biblica.com and http://facebook.com/Biblica.</p>
    </div>
  );
}

export default Settings;
