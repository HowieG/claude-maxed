import { useState, useCallback, useEffect } from 'react';
import { useClaude } from '../hooks/useClaude';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useFileContext } from '../hooks/useFileContext';
import { ContextTray } from './ContextTray';
import { TTSPlayer } from './TTSPlayer';
import { SPEECH_SYSTEM_PROMPT } from '../lib/prompts';
import ReactMarkdown from 'react-markdown';

export function SpeechMode() {
  const { messages, isLoading, streamingText, sendMessage, stopStreaming, resetConversation } = useClaude();
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const { isSpeaking, currentSentenceIndex, totalSentences, speak, stop: stopTTS, initialize } = useSpeechSynthesis();
  const { files, addFiles, removeFile, clearFiles } = useFileContext();
  const [ttsInitialized, setTtsInitialized] = useState(false);

  const handleMicTap = useCallback(async () => {
    // Initialize TTS on first user gesture
    if (!ttsInitialized) {
      initialize();
      setTtsInitialized(true);
    }

    if (isSpeaking) {
      stopTTS();
      return;
    }

    if (isListening) {
      stopListening();
      // transcript will be used after recognition ends
    } else {
      if (isLoading) {
        stopStreaming();
        return;
      }
      startListening();
    }
  }, [isListening, isLoading, isSpeaking, ttsInitialized, startListening, stopListening, stopStreaming, stopTTS, initialize]);

  // When recognition ends and we have a transcript, send it
  useEffect(() => {
    if (!isListening && transcript) {
      const doSend = async () => {
        try {
          const response = await sendMessage(transcript, SPEECH_SYSTEM_PROMPT, files);
          if (response) {
            const rate = parseFloat(localStorage.getItem('ttsRate') || '1.0');
            const voiceName = localStorage.getItem('ttsVoice') || '';
            speak(response, { rate, voiceName });
          }
        } catch {
          // Error is shown in messages
        }
      };
      doSend();
    }
  }, [isListening, transcript]);

  const currentText = streamingText || (messages.length > 0 ? messages[messages.length - 1]?.content : '');
  const showText = typeof currentText === 'string' ? currentText : '';

  return (
    <div className="flex flex-col h-full">
      {/* Response area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!showText && !isListening && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-2">Tap to speak</p>
              <p className="text-sm">Your question will be answered and read aloud</p>
            </div>
          </div>
        )}

        {(isListening || interimTranscript || transcript) && (
          <div className="mb-4 px-4 py-3 bg-warm/10 rounded-xl text-warm">
            <p className="text-sm opacity-60 mb-1">You said:</p>
            <p className="text-lg">{transcript}{interimTranscript && <span className="opacity-50">{interimTranscript}</span>}</p>
          </div>
        )}

        {showText && (
          <div className="text-lg leading-relaxed text-gray-200 message-content">
            <ReactMarkdown>{showText}</ReactMarkdown>
            {isLoading && <span className="inline-block w-2 h-5 bg-warm/60 animate-pulse ml-1" />}
          </div>
        )}
      </div>

      {/* TTS progress */}
      {isSpeaking && (
        <div className="px-6 pb-2">
          <TTSPlayer
            isSpeaking={isSpeaking}
            onStop={stopTTS}
            currentSentenceIndex={currentSentenceIndex}
            totalSentences={totalSentences}
          />
        </div>
      )}

      {/* Context tray */}
      <ContextTray files={files} onRemove={removeFile} onAddFiles={addFiles} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <button
          onClick={resetConversation}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-bg-lighter text-gray-400 hover:text-gray-200"
          title="New conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <button
          onClick={handleMicTap}
          disabled={!isSupported}
          className={`w-20 h-20 flex items-center justify-center rounded-full transition-all
            ${isListening ? 'bg-red-500 text-white pulse-mic scale-110' :
              isSpeaking ? 'bg-warm/30 text-warm' :
              isLoading ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-warm text-bg hover:scale-105'}
            disabled:opacity-30`}
        >
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          ) : isSpeaking ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : isLoading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>

        <div className="w-11" /> {/* spacer for alignment */}
      </div>
    </div>
  );
}
