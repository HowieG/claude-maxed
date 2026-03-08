import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const totalSentencesRef = useRef(0);
  const cancelledRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    function loadVoices() {
      const v = speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    }
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Must be called from a user gesture the first time on iOS
  const initialize = useCallback(() => {
    if (initializedRef.current) return;
    const utt = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(utt);
    initializedRef.current = true;
  }, []);

  const speak = useCallback((text, { rate = 1.0, voiceName } = {}) => {
    speechSynthesis.cancel();
    cancelledRef.current = false;

    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    totalSentencesRef.current = sentences.length;
    let index = 0;

    setIsSpeaking(true);

    function speakNext() {
      if (index >= sentences.length || cancelledRef.current) {
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
        return;
      }
      const utt = new SpeechSynthesisUtterance(sentences[index].trim());
      utt.rate = rate;
      if (voiceName) {
        const voice = speechSynthesis.getVoices().find((v) => v.name === voiceName);
        if (voice) utt.voice = voice;
      }
      const currentIdx = index;
      utt.onstart = () => setCurrentSentenceIndex(currentIdx);
      utt.onend = () => {
        index++;
        speakNext();
      };
      utt.onerror = () => {
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
      };
      speechSynthesis.speak(utt);
    }

    speakNext();
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentSentenceIndex(-1);
  }, []);

  return {
    isSpeaking,
    voices,
    currentSentenceIndex,
    totalSentences: totalSentencesRef.current,
    speak,
    stop,
    initialize,
  };
}
