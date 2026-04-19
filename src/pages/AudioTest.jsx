import { useCallback } from 'react';
import '../App.css';
import { auth, db } from "../firebase";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function VoiceInputTest() {
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <span>Your browser doesn't support speech recognition.</span>;
  }

  return (
    <div>
      <button onClick={SpeechRecognition.startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{listening ? "Listening..." : "Microphone is off"}</p>
      <p>{transcript}</p>
    </div>
  );
}

export default VoiceInputTest;