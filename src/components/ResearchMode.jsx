import { useState, useCallback, useMemo } from 'react';
import { useClaude } from '../hooks/useClaude';
import { useClips } from '../hooks/useClips';
import { useClipMode } from '../hooks/useClipMode';
import { useDoubleTap } from '../hooks/useDoubleTap';
import { useFileContext } from '../hooks/useFileContext';
import { useDropZone } from '../hooks/useDropZone';
import { ChatPanel } from './ChatPanel';
import { ClipsPanel } from './ClipsPanel';
import { DropZoneOverlay } from './DropZoneOverlay';
import { RESEARCH_SYSTEM_PROMPT } from '../lib/prompts';
import { injectClipContext } from '../lib/clipInjector';

export function ResearchMode() {
  const { messages, isLoading, streamingText, sendMessage, resetConversation } = useClaude();
  const { clips, addClip, removeClip, clearClips } = useClips();
  const { clipMode } = useClipMode();
  const { files, addFiles, removeFile } = useFileContext();
  const { isDragging } = useDropZone(addFiles);
  const [showClipsSheet, setShowClipsSheet] = useState(false);
  const [isMobile] = useState(() => window.innerWidth < 768);

  // Track which sentences are clipped: key = "msgIndex-sentenceIndex" → clip number
  const [clippedSentences, setClippedSentences] = useState(new Map());

  // Track referenced clips per user message index
  const [referencedClipsMap, setReferencedClipsMap] = useState(new Map());

  const handleClipSentence = useCallback((text, messageIndex) => {
    // Remove the superscript clip number text that might be at the end
    const cleanText = text.replace(/\[\d+\]\s*$/, '').trim();
    const clipNumber = addClip(cleanText, messageIndex);
    // We need to find the sentence index - it'll be added via the key pattern
    // Since we don't have sentenceIndex here, we track by content
    setClippedSentences((prev) => {
      const next = new Map(prev);
      // Find which sentence in this message matches
      // For simplicity, we'll use a compound key approach
      return next;
    });
  }, [addClip]);

  // Better approach: track clips with full context
  const handleClipFromBubble = useCallback((text, messageIndex) => {
    const cleanText = text.replace(/\[\d+\]\s*$/, '').trim();
    const clipNumber = addClip(cleanText, messageIndex);
    return clipNumber;
  }, [addClip]);

  // Build clippedSentences map from clips state
  const clippedSentencesMap = useMemo(() => {
    const map = new Map();
    for (const clip of clips) {
      // Find which message and sentence this clip belongs to
      const msg = messages[clip.messageIndex];
      if (msg && typeof msg.content === 'string') {
        const sentences = msg.content.match(/[^.!?]*[.!?]+[\s]*/g) || [msg.content];
        const idx = sentences.findIndex((s) => s.trim().startsWith(clip.text.slice(0, 30)));
        if (idx >= 0) {
          map.set(`${clip.messageIndex}-${idx}`, clip.number);
        }
      }
    }
    return map;
  }, [clips, messages]);

  const handleDoubleTap = useCallback((sentenceIndex, messageIndex, text) => {
    const cleanText = text.replace(/\[\d+\]\s*$/, '').trim();
    addClip(cleanText, messageIndex);
  }, [addClip]);

  const doubleTapHandler = useDoubleTap(handleDoubleTap);

  const handleSend = useCallback(async (text) => {
    const { text: injectedText, referenced } = injectClipContext(text, clips);

    // Track which clips were referenced for this message
    if (referenced.length > 0) {
      const msgIndex = messages.length; // This will be the user message index
      setReferencedClipsMap((prev) => {
        const next = new Map(prev);
        next.set(msgIndex, referenced);
        return next;
      });
    }

    try {
      await sendMessage(injectedText, RESEARCH_SYSTEM_PROMPT, files);
    } catch {
      // Error shown in messages
    }
  }, [clips, files, messages.length, sendMessage]);

  const handleClipPrompt = useCallback((prompt) => {
    handleSend(prompt);
    setShowClipsSheet(false);
  }, [handleSend]);

  const handleNewConversation = () => {
    resetConversation();
    clearClips();
    setClippedSentences(new Map());
    setReferencedClipsMap(new Map());
  };

  return (
    <div className="flex h-full relative">
      <DropZoneOverlay isDragging={isDragging} />

      {/* Chat panel */}
      <div className={`flex flex-col ${isMobile ? 'w-full' : 'flex-1'} min-w-0`}>
        <ChatPanel
          messages={messages}
          streamingText={streamingText}
          isLoading={isLoading}
          onSend={handleSend}
          clipMode={clipMode}
          clippedSentences={clippedSentencesMap}
          onClipSentence={handleClipFromBubble}
          onDoubleTapHandler={doubleTapHandler}
          files={files}
          onRemoveFile={removeFile}
          onAddFiles={addFiles}
          referencedClipsMap={referencedClipsMap}
        />
      </div>

      {/* Desktop clips sidebar */}
      {!isMobile && (
        <div className="w-80 flex-shrink-0">
          <ClipsPanel
            clips={clips}
            onRemove={removeClip}
            onClear={clearClips}
            onSendPrompt={handleClipPrompt}
          />
        </div>
      )}

      {/* Mobile clips badge */}
      {isMobile && (
        <button
          onClick={() => setShowClipsSheet(true)}
          className="fixed bottom-20 right-4 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-warm text-bg shadow-lg"
        >
          <span className="text-sm font-bold">{clips.length}</span>
          <span className="text-xs ml-0.5">📋</span>
        </button>
      )}

      {/* Mobile clips sheet */}
      {isMobile && showClipsSheet && (
        <ClipsPanel
          clips={clips}
          onRemove={removeClip}
          onClear={clearClips}
          onSendPrompt={handleClipPrompt}
          isSheet
          onClose={() => setShowClipsSheet(false)}
        />
      )}
    </div>
  );
}
