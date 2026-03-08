import { useRef } from 'react';
import { estimateTokens } from '../hooks/useFileContext';

const FILE_ICONS = {
  text: '📄',
  image: '🖼️',
  pdf: '📑',
};

export function ContextTray({ files, onRemove, onAddFiles }) {
  const inputRef = useRef(null);
  const tokens = estimateTokens(files);
  const tokenPct = Math.round((tokens / 200000) * 100);

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-bg-lighter overflow-x-auto">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-bg-lighter text-gray-400 hover:text-warm transition-colors"
        title="Attach file"
      >
        📎
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".md,.txt,.py,.js,.ts,.jsx,.tsx,.json,.yaml,.yml,.toml,.rs,.go,.java,.rb,.sh,.sql,.css,.html,.xml,.csv,.svg,.png,.jpg,.jpeg,.gif,.webp,.pdf"
      />

      {files.map((f) => (
        <div
          key={f.id}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-bg-lighter rounded text-xs text-gray-300 max-w-[140px]"
        >
          <span>{FILE_ICONS[f.type] || '📄'}</span>
          <span className="truncate">{f.name}</span>
          <button
            onClick={() => onRemove(f.id)}
            className="text-gray-500 hover:text-red-400 ml-1"
          >
            ✕
          </button>
        </div>
      ))}

      {files.length > 0 && (
        <span className={`flex-shrink-0 text-xs ml-auto ${tokenPct > 50 ? (tokenPct > 80 ? 'text-red-400' : 'text-yellow-400') : 'text-gray-500'}`}>
          ~{tokens >= 1000 ? `${Math.round(tokens / 1000)}k` : tokens} / 200k tokens
        </span>
      )}
    </div>
  );
}
