import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';
import { ContextTray } from './ContextTray';

export function ChatPanel({
  messages,
  streamingText,
  isLoading,
  onSend,
  clipMode,
  clippedSentences,
  onClipSentence,
  onDoubleTapHandler,
  files,
  onRemoveFile,
  onAddFiles,
  referencedClipsMap,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleVoiceTranscript = (text) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 chat-panel">
        {messages.length === 0 && !streamingText && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-1">Start a conversation</p>
              <p className="text-sm">Type a message or use voice input</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            messageIndex={i}
            clipMode={clipMode}
            clippedSentences={clippedSentences}
            onClipSentence={onClipSentence}
            onDoubleTapHandler={onDoubleTapHandler}
            referencedClips={referencedClipsMap?.get(i)}
          />
        ))}

        {streamingText && (
          <MessageBubble
            message={{ role: 'assistant', content: streamingText }}
            messageIndex={messages.length}
            isStreaming
          />
        )}

        <div ref={bottomRef} />
      </div>

      {(files?.length > 0 || true) && (
        <ContextTray files={files} onRemove={onRemoveFile} onAddFiles={onAddFiles} />
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-bg-lighter">
        <VoiceInput onTranscript={handleVoiceTranscript} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-bg-lighter rounded-full text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-warm/50"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-warm text-bg disabled:opacity-30 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
