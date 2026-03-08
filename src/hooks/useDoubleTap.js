import { useCallback, useRef } from 'react';

export function useDoubleTap(onDoubleTap, delay = 300) {
  const lastTap = useRef(0);
  const lastTarget = useRef(null);

  const handleTap = useCallback((e) => {
    const sentenceSpan = e.target.closest('[data-sentence-index]');
    if (!sentenceSpan) return;

    const now = Date.now();
    const sameSentence = lastTarget.current === sentenceSpan;

    if (sameSentence && now - lastTap.current < delay) {
      e.preventDefault();
      const index = parseInt(sentenceSpan.dataset.sentenceIndex);
      const messageIndex = parseInt(sentenceSpan.dataset.messageIndex);
      const text = sentenceSpan.textContent;
      onDoubleTap(index, messageIndex, text);
      lastTap.current = 0;
      lastTarget.current = null;
    } else {
      lastTap.current = now;
      lastTarget.current = sentenceSpan;
    }
  }, [onDoubleTap, delay]);

  return handleTap;
}
