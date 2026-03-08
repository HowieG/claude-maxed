export function TTSPlayer({ isSpeaking, onStop, currentSentenceIndex, totalSentences }) {
  if (!isSpeaking) return null;

  const progress = totalSentences > 0 ? ((currentSentenceIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-lighter rounded-lg text-sm">
      <div className="flex-1 h-1 bg-bg rounded-full overflow-hidden">
        <div
          className="h-full bg-warm transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <button
        onClick={onStop}
        className="text-gray-400 hover:text-red-400 transition-colors"
        title="Stop speaking"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
    </div>
  );
}
