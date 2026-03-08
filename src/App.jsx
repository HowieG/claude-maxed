import { useState } from 'react';
import { SpeechMode } from './components/SpeechMode';
import { ResearchMode } from './components/ResearchMode';
import { Settings } from './components/Settings';

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('defaultMode') || 'speech');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-full flex flex-col bg-bg text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-bg-lighter flex-shrink-0">
        <h1 className="text-sm font-semibold text-warm tracking-wide">Claude Companion</h1>

        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <div className="flex bg-bg-lighter rounded-lg p-0.5">
            <button
              onClick={() => setMode('speech')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'speech' ? 'bg-warm text-bg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Speech
            </button>
            <button
              onClick={() => setMode('research')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'research' ? 'bg-warm text-bg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Research
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-warm transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0">
        {mode === 'speech' ? <SpeechMode /> : <ResearchMode />}
      </main>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
