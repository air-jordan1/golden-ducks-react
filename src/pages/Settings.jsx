import React from 'react';

function Settings() {
  const bibleApis = ['ESV API', 'KJV API', 'Mormon Bible API'];
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