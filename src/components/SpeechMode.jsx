import { useState, useCallback, useEffect, useRef } from 'react';
import { useClaude } from '../hooks/useClaude';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useFileContext } from '../hooks/useFileContext';
import { useFileReader } from '../hooks/useFileReader';
import { useWakeWordInterrupt } from '../hooks/useWakeWordInterrupt';
import { ContextTray } from './ContextTray';
import { TTSPlayer } from './TTSPlayer';
import { SPEECH_SYSTEM_PROMPT, FILE_READER_SYSTEM_PROMPT } from '../lib/prompts';
import ReactMarkdown from 'react-markdown';

const READ_FILE_PATTERN = /\b(read\s+(this|the)\s+file|read\s+it\s+to\s+me|walk\s+me\s+through)\b/i;
const RESUME_PATTERN = /\b(continue|resume|keep\s+reading|go\s+on|carry\s+on)\b/i;

export function SpeechMode() {
  const { messages, isLoading, streamingText, sendMessage, stopStreaming, resetConversation } = useClaude();
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const { isSpeaking, currentSentenceIndex, totalSentences, speak, stop: stopTTS, initialize } = useSpeechSynthesis();
  const { files, addFiles, removeFile, clearFiles } = useFileContext();
  const fileReader = useFileReader();
  const [ttsInitialized, setTtsInitialized] = useState(false);
  const handsFreeEnabled = localStorage.getItem('handsFreeModeEnabled') === 'true';

  // Track TTS sentence position for file reader
  useEffect(() => {
    if (fileReader.isReading && !fileReader.isTangent && currentSentenceIndex >= 0) {
      fileReader.updatePosition(currentSentenceIndex);
    }
  }, [currentSentenceIndex, fileReader.isReading, fileReader.isTangent]);

  // Wake word interrupt handlers
  const wakeWordPauseRef = useRef(null);

  const handleWakeWordPause = useCallback(() => {
    stopTTS();
    if (fileReader.isReading) fileReader.interrupt();
  }, [stopTTS, fileReader]);

  const handleWakeWord = useCallback(() => {
    // User said the wake word — start listening for their question
    startListening();
  }, [startListening]);

  const handleWakeWordResume = useCallback(() => {
    // False alarm — resume TTS
    if (fileReader.isReading && fileReader.isTangent) {
      const { remainingText } = fileReader.resume();
      if (remainingText) {
        const rate = parseFloat(localStorage.getItem('ttsRate') || '1.0');
        const voiceName = localStorage.getItem('ttsVoice') || '';
        speak(remainingText, { rate, voiceName });
      }
    }
    // For non-file-reader speech, we can't easily resume normal responses
    // since we don't track their sentence position the same way
  }, [fileReader, speak]);

  const wakeWord = useWakeWordInterrupt({
    onPause: handleWakeWordPause,
    onWakeWord: handleWakeWord,
    onResume: handleWakeWordResume,
  });

  // Start/stop wake word monitoring when TTS starts/stops
  useEffect(() => {
    if (handsFreeEnabled && isSpeaking && !wakeWord.isMonitoring) {
      wakeWord.startMonitoring();
    } else if (handsFreeEnabled && !isSpeaking && wakeWord.isMonitoring) {
      wakeWord.stopMonitoring();
    }
  }, [isSpeaking, handsFreeEnabled]);

  // Restart VAD polling after resume
  useEffect(() => {
    if (handsFreeEnabled && isSpeaking && wakeWord.isMonitoring) {
      wakeWord.resumeMonitoring();
    }
  }, [isSpeaking, handsFreeEnabled]);

  const handleMicTap = useCallback(async () => {
    // Initialize TTS on first user gesture
    if (!ttsInitialized) {
      initialize();
      setTtsInitialized(true);
    }

    // One-tap interrupt: stop TTS + immediately start listening
    if (isSpeaking) {
      stopTTS();
      if (fileReader.isReading) fileReader.interrupt();
      setTimeout(() => startListening(), 100); // iOS needs gap after cancel
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      if (isLoading) {
        stopStreaming();
        return;
      }
      startListening();
    }
  }, [isListening, isLoading, isSpeaking, ttsInitialized, startListening, stopListening, stopStreaming, stopTTS, initialize, fileReader]);

  // Handle file reading via voice command or resume
  const handleReadFile = useCallback(async (file) => {
    if (!ttsInitialized) {
      initialize();
      setTtsInitialized(true);
    }

    try {
      const prompt = `Here is the file content to rewrite for speech:\n\n[File: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\``;
      const response = await sendMessage(prompt, FILE_READER_SYSTEM_PROMPT, []);
      if (response) {
        fileReader.startReading(response, file.name);
        const rate = parseFloat(localStorage.getItem('ttsRate') || '1.0');
        const voiceName = localStorage.getItem('ttsVoice') || '';
        speak(response, { rate, voiceName });
      }
    } catch {
      // Error shown in messages
    }
  }, [ttsInitialized, initialize, sendMessage, fileReader, speak]);

  const handleResumeReading = useCallback(() => {
    const { remainingText } = fileReader.resume();
    if (remainingText) {
      const rate = parseFloat(localStorage.getItem('ttsRate') || '1.0');
      const voiceName = localStorage.getItem('ttsVoice') || '';
      speak(remainingText, { rate, voiceName });
    }
  }, [fileReader, speak]);

  // When recognition ends and we have a transcript, send it
  useEffect(() => {
    if (!isListening && transcript) {
      // Check for resume voice command
      if (fileReader.isReading && fileReader.isTangent && RESUME_PATTERN.test(transcript)) {
        handleResumeReading();
        return;
      }

      // Check for read-file voice command
      if (files.length > 0 && READ_FILE_PATTERN.test(transcript)) {
        const textFile = files.find((f) => f.type === 'text');
        if (textFile) {
          handleReadFile(textFile);
          return;
        }
      }

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

  const handleReset = useCallback(() => {
    fileReader.reset();
    resetConversation();
  }, [fileReader, resetConversation]);

  const currentText = streamingText || (messages.length > 0 ? messages[messages.length - 1]?.content : '');
  const showText = typeof currentText === 'string' ? currentText : '';

  const showResumeButton = fileReader.isReading && fileReader.isTangent && !isSpeaking && !isLoading && !isListening;

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

      {/* TTS progress / Reading progress */}
      {isSpeaking && (
        <div className="px-6 pb-2">
          {fileReader.isReading && !fileReader.isTangent ? (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="text-warm">Reading {fileReader.fileName}</span>
              <span>{fileReader.currentPosition + 1} / {fileReader.totalSentences}</span>
              <div className="flex-1 h-1 bg-bg-lighter rounded-full overflow-hidden">
                <div
                  className="h-full bg-warm/60 rounded-full transition-all"
                  style={{ width: `${((fileReader.currentPosition + 1) / fileReader.totalSentences) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <TTSPlayer
              isSpeaking={isSpeaking}
              onStop={stopTTS}
              currentSentenceIndex={currentSentenceIndex}
              totalSentences={totalSentences}
            />
          )}
        </div>
      )}

      {/* Resume Reading button */}
      {showResumeButton && (
        <div className="px-6 pb-2 flex justify-center">
          <button
            onClick={handleResumeReading}
            className="px-4 py-2 bg-warm/20 text-warm rounded-full text-sm hover:bg-warm/30 transition-colors"
          >
            Resume Reading {fileReader.fileName}
          </button>
        </div>
      )}

      {/* Context tray */}
      <ContextTray files={files} onRemove={removeFile} onAddFiles={addFiles} onReadFile={handleReadFile} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <button
          onClick={handleReset}
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
