import { useState, useCallback, useRef } from 'react';
import { splitSentences } from '../lib/textUtils';

export function useFileReader() {
  const [isReading, setIsReading] = useState(false);
  const [readingText, setReadingText] = useState('');
  const [sentences, setSentences] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isTangent, setIsTangent] = useState(false);
  const [fileName, setFileName] = useState('');
  const resumeOffsetRef = useRef(0);

  const startReading = useCallback((text, name) => {
    const s = splitSentences(text);
    setReadingText(text);
    setSentences(s);
    setCurrentPosition(0);
    setIsTangent(false);
    setIsReading(true);
    setFileName(name);
    resumeOffsetRef.current = 0;
  }, []);

  const interrupt = useCallback(() => {
    setIsTangent(true);
  }, []);

  const resume = useCallback(() => {
    const remaining = sentences.slice(currentPosition + 1);
    const remainingText = remaining.join(' ');
    resumeOffsetRef.current = currentPosition + 1;
    setIsTangent(false);
    return { remainingText, offset: resumeOffsetRef.current };
  }, [sentences, currentPosition]);

  const updatePosition = useCallback((ttsSentenceIndex) => {
    setCurrentPosition(resumeOffsetRef.current + ttsSentenceIndex);
  }, []);

  const reset = useCallback(() => {
    setIsReading(false);
    setReadingText('');
    setSentences([]);
    setCurrentPosition(0);
    setIsTangent(false);
    setFileName('');
    resumeOffsetRef.current = 0;
  }, []);

  return {
    isReading,
    readingText,
    sentences,
    currentPosition,
    isTangent,
    fileName,
    totalSentences: sentences.length,
    startReading,
    interrupt,
    resume,
    updatePosition,
    reset,
  };
}
