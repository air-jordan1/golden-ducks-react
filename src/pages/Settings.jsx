import React from 'react';
import { useEffect } from 'react';

function Settings() {
  const bibleApis = ['ESV API', 'KJV API', 'Mormon Bible API'];

  function FetchTranslation() {
    fetch('https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/john/chapters/3/verses/16.json)', []);
  }

  function Translation() {
    useEffect(FetchTranslation, []);
  }

  function ChangeTranslation({translation}) {
    return 
  }

  return (
    <div>
      <h1>Settings</h1>
      <p>Change translation?.</p>
      <select>
        {bibleApis.map(api => <option key={api}>{api}</option>)}
      </select>
    </div>
  );
}

export default Settings;