import { useEffect, useState } from 'react';

function Settings() {

  function TranslationController() {
    const selectorOptions = ['asv', 'gnv', 'kjv']; // selector options
    const [version, setVersion] = useState(selectorOptions[0]); // version
    const [selectedApi, setSelectedApi] = useState(null); // actual text

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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(to right, #45a247, #283c86)',
        color: 'white' }} >
        <p>Change translation?.</p>
        <select onChange = {handleSelection}>
          {selectorOptions.map(api => <option key={api} value={api}>{api}</option>)}
        </select>
        <p><DemoPassage /></p>
      </div>
    )
  }

  return (
    <div>
      <h1>Settings</h1>
      <TranslationController />
    </div>
  )
}

export default Settings;