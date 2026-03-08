import { useState, useEffect, useRef, useCallback } from 'react';

export function useDropZone(onDrop) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files);
  }, [onDrop]);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      setIsDragging(true);
    };
    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) setIsDragging(false);
    };
    const handleDragOver = (e) => e.preventDefault();

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDrop]);

  return { isDragging };
}
