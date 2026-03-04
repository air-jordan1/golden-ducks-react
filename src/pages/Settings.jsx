import React from 'react';
import { useEffect, useState } from 'react';

function Settings() {

  function Translation() {

  }

  function TranslationController() {
    const bibleApis = ['ASV', 'Geneva', 'KJV'];
    const [selectedApi, setSelectedApi] = useState(bibleApis[0]);

    function GetTranslation() {

    }

    function ChangeTranslation(selectedApi) {
      useEffect(() => { 
        const api = fetch("https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-asv/books/john/chapters/3/verses/16.json", [])
        .then((response) => {return response.json()});
        
      }, [selectedApi]);
    }

    return (
      <div>
        <p>Change translation?.</p>
        <select>
          {bibleApis.map(api => <option key={api}>{api}</option>)}
        </select>
      </div>
    )
  }

  function DemoPassage() {
    return verse1
  }

  return (
    <div>
      <h1>Settings</h1>
      <TranslationController />
    </div>
  );
}

export default Settings;