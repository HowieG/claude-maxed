import { useState } from 'react';

export function ClipsPanel({ clips, onRemove, onClear, onSendPrompt, isSheet = false, onClose }) {
  const [quickPrompt, setQuickPrompt] = useState('');

  const handleTellMore = (clipNumber) => {
    onSendPrompt(`Tell me more about #${clipNumber}`);
  };

  const handleQuickSend = () => {
    if (quickPrompt.trim()) {
      onSendPrompt(quickPrompt.trim());
      setQuickPrompt('');
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-lighter">
        <h3 className="text-sm font-semibold text-warm">Saved Clips ({clips.length})</h3>
        <div className="flex items-center gap-2">
          {clips.length > 0 && (
            <button onClick={onClear} className="text-xs text-gray-500 hover:text-red-400">
              Clear all
            </button>
          )}
          {isSheet && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg leading-none">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {clips.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>No clips yet.</p>
            <p className="mt-1 text-xs">
              Desktop: Hold <kbd className="px-1 py-0.5 bg-bg rounded text-xs">Alt</kbd> + click sentences
            </p>
            <p className="text-xs">Mobile: Double-tap sentences</p>
          </div>
        ) : (
          clips.map((clip) => (
            <div key={clip.id} className="bg-bg rounded-lg p-3 border border-bg-lighter">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded bg-warm/20 text-warm text-xs font-mono font-bold">
                  {clip.number}
                </span>
                <p className="text-sm text-gray-300 flex-1 leading-relaxed">"{clip.text}"</p>
                <button
                  onClick={() => onRemove(clip.id)}
                  className="flex-shrink-0 text-gray-600 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => handleTellMore(clip.number)}
                className="mt-2 text-xs text-warm/70 hover:text-warm transition-colors"
              >
                Tell me more →
              </button>
            </div>
          ))
        )}
      </div>

      {clips.length > 0 && (
        <div className="px-4 py-3 border-t border-bg-lighter">
          <p className="text-xs text-gray-500 mb-2">Quick prompt (use #N to reference clips)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickSend()}
              placeholder="#1 contradicts #3. Explain."
              className="flex-1 px-3 py-2 bg-bg rounded-lg border border-bg-lighter text-sm text-gray-100 focus:outline-none focus:border-warm"
            />
            <button
              onClick={handleQuickSend}
              disabled={!quickPrompt.trim()}
              className="px-3 py-2 bg-warm text-bg rounded-lg text-sm font-medium disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isSheet) {
    return (
      <div className="fixed inset-0 z-40" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute bottom-0 left-0 right-0 bg-bg-light rounded-t-2xl max-h-[70vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-bg-lighter rounded-full mx-auto mt-2" />
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bg-light border-l border-bg-lighter flex flex-col">
      {content}
    </div>
  );
}
