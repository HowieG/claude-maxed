import { useState, useCallback, useRef } from 'react';

const WAKE_WORD_PATTERN = /ok\s*(wait|claude)/i;
const RMS_THRESHOLD = 30;
const NOISE_DURATION_MS = 200;

export function useWakeWordInterrupt({ onPause, onWakeWord, onResume }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const noiseStartRef = useRef(null);
  const pausedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    noiseStartRef.current = null;
    pausedRef.current = false;
  }, []);

  const startRecognitionForWakeWord = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onResume();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let matched = false;
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          const text = event.results[i][j].transcript;
          if (WAKE_WORD_PATTERN.test(text)) {
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (matched) {
        onWakeWord();
      } else {
        onResume();
      }
    };

    recognition.onerror = () => {
      onResume();
    };

    recognition.onnomatch = () => {
      onResume();
    };

    // Timeout: if no speech detected within 3s, resume
    const timeout = setTimeout(() => {
      try { recognition.abort(); } catch {}
      onResume();
    }, 3000);

    recognition.onend = () => {
      clearTimeout(timeout);
    };

    try {
      recognition.start();
    } catch {
      onResume();
    }
  }, [onWakeWord, onResume]);

  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      pausedRef.current = false;

      function poll() {
        if (!analyserRef.current || pausedRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const rms = sum / dataArray.length;

        if (rms > RMS_THRESHOLD) {
          if (!noiseStartRef.current) {
            noiseStartRef.current = Date.now();
          } else if (Date.now() - noiseStartRef.current > NOISE_DURATION_MS) {
            // Sustained noise detected — pause TTS and check for wake word
            pausedRef.current = true;
            onPause();
            // Small delay to let TTS fully stop before starting recognition
            setTimeout(() => startRecognitionForWakeWord(), 150);
            return;
          }
        } else {
          noiseStartRef.current = null;
        }

        rafRef.current = requestAnimationFrame(poll);
      }

      rafRef.current = requestAnimationFrame(poll);
      setIsMonitoring(true);
    } catch (err) {
      console.error('Wake word monitoring failed:', err);
      cleanup();
    }
  }, [isMonitoring, onPause, startRecognitionForWakeWord, cleanup]);

  const stopMonitoring = useCallback(() => {
    cleanup();
    setIsMonitoring(false);
  }, [cleanup]);

  // Allow restarting the VAD polling after a resume
  const resumeMonitoring = useCallback(() => {
    if (!analyserRef.current) return;
    pausedRef.current = false;
    noiseStartRef.current = null;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function poll() {
      if (!analyserRef.current || pausedRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const rms = sum / dataArray.length;

      if (rms > RMS_THRESHOLD) {
        if (!noiseStartRef.current) {
          noiseStartRef.current = Date.now();
        } else if (Date.now() - noiseStartRef.current > NOISE_DURATION_MS) {
          pausedRef.current = true;
          onPause();
          setTimeout(() => startRecognitionForWakeWord(), 150);
          return;
        }
      } else {
        noiseStartRef.current = null;
      }

      rafRef.current = requestAnimationFrame(poll);
    }

    rafRef.current = requestAnimationFrame(poll);
  }, [onPause, startRecognitionForWakeWord]);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resumeMonitoring,
  };
}
