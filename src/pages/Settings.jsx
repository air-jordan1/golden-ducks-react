import React from 'react';
import { useEffect, useState } from 'react';

function Settings() {

  var passage;
  const bibleApis = ['ASV', 'Geneva', 'KJV'];

  function Translation() {
  }

  function TranslationController() {
    function GetTranslation() {
      useEffect( () =>
        fetch('https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/john/chapters/3/verses/16.json)', [])
        .then((response) => response.json())
        .then((data) => passage = data.text )
        , [])
    }

    function ChangeTranslation() {

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
      <p>{passage}</p>
    </div>
  );
}

export default Settings;