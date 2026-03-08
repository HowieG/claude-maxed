import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function VoiceInput({ onTranscript, className = '' }) {
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useSpeechRecognition();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) onTranscript(transcript);
    } else {
      startListening();
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleToggle}
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors
        ${isListening ? 'bg-red-500/20 text-red-400 pulse-mic' : 'bg-bg-lighter text-gray-400 hover:text-warm'}
        ${className}`}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
}
