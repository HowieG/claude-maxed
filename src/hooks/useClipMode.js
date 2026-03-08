import { useState, useEffect } from 'react';

export function useClipMode() {
  const [clipMode, setClipMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setClipMode(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Alt') setClipMode(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { clipMode, setClipMode };
}
