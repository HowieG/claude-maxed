import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function splitIntoSentences(text) {
  const sentences = text.match(/[^.!?]*[.!?]+[\s]*/g);
  if (!sentences) return [text];
  // Capture any trailing text without terminal punctuation
  const joined = sentences.join('');
  if (joined.length < text.length) {
    sentences.push(text.slice(joined.length));
  }
  return sentences.map((s) => s.trim()).filter(Boolean);
}

export function MessageBubble({
  message,
  messageIndex,
  isStreaming = false,
  clipMode = false,
  clippedSentences = new Map(),
  onClipSentence,
  onDoubleTapHandler,
  referencedClips,
}) {
  const [hoveredSentence, setHoveredSentence] = useState(null);
  const [flashingSentence, setFlashingSentence] = useState(null);

  const isUser = message.role === 'user';
  const text = typeof message.content === 'string'
    ? message.content
    : message.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n') || '';

  const handleClip = useCallback((sentenceIdx, sentenceText) => {
    if (onClipSentence) {
      onClipSentence(sentenceText, messageIndex);
      setFlashingSentence(sentenceIdx);
      setTimeout(() => setFlashingSentence(null), 400);
    }
  }, [onClipSentence, messageIndex]);

  if (isUser) {
    // Extract only the actual user text (last text block, or remove [Reference context] prefix)
    let displayText = text;
    const userQ = text.match(/\[User's question\]\n([\s\S]*)/);
    if (userQ) displayText = userQ[1];

    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-warm/20 text-gray-100">
          {referencedClips && referencedClips.length > 0 && (
            <details className="text-xs text-gray-400 mb-2">
              <summary className="cursor-pointer hover:text-gray-300">Context sent ({referencedClips.length} clip{referencedClips.length > 1 ? 's' : ''})</summary>
              <div className="mt-1 space-y-1">
                {referencedClips.map((c) => (
                  <div key={c.number} className="pl-2 border-l border-warm/30">
                    <span className="text-warm">#{c.number}:</span> {c.text.slice(0, 100)}{c.text.length > 100 ? '...' : ''}
                  </div>
                ))}
              </div>
            </details>
          )}
          <p className="whitespace-pre-wrap">{displayText}</p>
        </div>
      </div>
    );
  }

  // Assistant message — render with sentence spans for clipping
  const sentences = splitIntoSentences(text);

  return (
    <div className="flex justify-start mb-3">
      <div
        className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-bg-lighter text-gray-100"
        onTouchEnd={onDoubleTapHandler}
      >
        {isStreaming ? (
          <div className="message-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            <span className="inline-block w-2 h-4 bg-warm/60 animate-pulse ml-0.5" />
          </div>
        ) : (
          <div className="leading-relaxed">
            {sentences.map((sentence, i) => (
              <span
                key={i}
                data-sentence-index={i}
                data-message-index={messageIndex}
                className={`
                  inline
                  ${clipMode ? 'cursor-pointer' : ''}
                  ${hoveredSentence === i && clipMode ? 'bg-amber-500/20 rounded px-0.5' : ''}
                  ${flashingSentence === i ? 'clip-flash' : ''}
                  ${clippedSentences.has(`${messageIndex}-${i}`) ? 'border-l-2 border-amber-500 pl-1' : ''}
                `}
                onMouseEnter={() => clipMode && setHoveredSentence(i)}
                onMouseLeave={() => setHoveredSentence(null)}
                onClick={() => clipMode && handleClip(i, sentence)}
              >
                {sentence}{' '}
                {clippedSentences.has(`${messageIndex}-${i}`) && (
                  <sup className="text-xs text-amber-500 font-mono">
                    [{clippedSentences.get(`${messageIndex}-${i}`)}]
                  </sup>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
