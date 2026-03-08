import { useState, useCallback } from 'react';

const TEXT_EXTS = new Set([
  'md','txt','py','js','ts','jsx','tsx','json','yaml','yml','toml','rs','go',
  'java','rb','sh','sql','css','html','xml','csv','env','dockerfile','tf','svg',
]);
const IMG_EXTS = new Set(['png','jpg','jpeg','gif','webp']);

function getExt(name) {
  return (name.split('.').pop() || '').toLowerCase();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Rough token estimate: ~4 chars per token for text, ~1600 tokens per image
export function estimateTokens(files) {
  let total = 0;
  for (const f of files) {
    if (f.type === 'text') total += Math.ceil((f.content?.length || 0) / 4);
    else if (f.type === 'image') total += 1600;
    else if (f.type === 'pdf') total += Math.ceil((f.size || 0) / 4);
  }
  return total;
}

export function useFileContext() {
  const [files, setFiles] = useState([]);

  const addFiles = useCallback(async (fileList) => {
    const processed = await Promise.all(
      Array.from(fileList).map(async (file) => {
        const ext = getExt(file.name);

        if (TEXT_EXTS.has(ext)) {
          const text = await file.text();
          return { id: crypto.randomUUID(), name: file.name, type: 'text', content: text, size: file.size };
        }

        if (IMG_EXTS.has(ext)) {
          const base64 = await fileToBase64(file);
          return { id: crypto.randomUUID(), name: file.name, type: 'image', base64, mimeType: file.type, size: file.size };
        }

        if (ext === 'pdf') {
          const base64 = await fileToBase64(file);
          return { id: crypto.randomUUID(), name: file.name, type: 'pdf', base64, mimeType: 'application/pdf', size: file.size };
        }

        return null;
      })
    );

    const valid = processed.filter(Boolean);
    const skipped = fileList.length - valid.length;
    setFiles((prev) => [...prev, ...valid]);
    return { added: valid.length, skipped };
  }, []);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  return { files, addFiles, removeFile, clearFiles };
}
