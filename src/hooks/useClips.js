import { useState, useCallback } from 'react';

export function useClips() {
  const [clips, setClips] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);

  const addClip = useCallback((text, messageIndex) => {
    let assignedNumber;
    setNextNumber((n) => {
      assignedNumber = n;
      return n + 1;
    });
    const clip = {
      id: crypto.randomUUID(),
      number: assignedNumber,
      text,
      messageIndex,
    };
    setClips((prev) => [...prev, clip]);
    return assignedNumber;
  }, []);

  const removeClip = useCallback((id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearClips = useCallback(() => {
    setClips([]);
    setNextNumber(1);
  }, []);

  return { clips, addClip, removeClip, clearClips };
}
