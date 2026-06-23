import { useCallback } from 'react';
import '../App.css';

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function VoiceInputTest() {
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const startListening = useCallback(() => {
    SpeechRecognition.startListening({ continuous: true });
  }, []);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <span>Your browser doesn't support speech recognition.</span>;
  }
  if (!SpeechRecognition.browserSupportsContinuousListening()) {
    return <span>Your browser doesn't support continuous speech listening.</span>;
  }

  return (
    <div>
      <button onClick={startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{listening ? "Listening..." : "Microphone is off"}</p>
      <p>{transcript}</p>
    </div>
  );
}

export default VoiceInputTest;