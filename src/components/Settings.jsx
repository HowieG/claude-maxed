import { useState, useEffect } from 'react';

export function Settings({ isOpen, onClose }) {
  const [proxyUrl, setProxyUrl] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVoice, setTtsVoice] = useState('');
  const [defaultMode, setDefaultMode] = useState('speech');
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    setProxyUrl(localStorage.getItem('proxyUrl') || '');
    setModel(localStorage.getItem('model') || 'claude-sonnet-4-20250514');
    setTtsRate(parseFloat(localStorage.getItem('ttsRate') || '1.0'));
    setTtsVoice(localStorage.getItem('ttsVoice') || '');
    setDefaultMode(localStorage.getItem('defaultMode') || 'speech');

    const v = speechSynthesis.getVoices();
    setVoices(v);
    const handler = () => setVoices(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', handler);
    return () => speechSynthesis.removeEventListener('voiceschanged', handler);
  }, [isOpen]);

  const save = () => {
    localStorage.setItem('proxyUrl', proxyUrl);
    localStorage.setItem('model', model);
    localStorage.setItem('ttsRate', String(ttsRate));
    localStorage.setItem('ttsVoice', ttsVoice);
    localStorage.setItem('defaultMode', defaultMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-light rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-warm">Settings</h2>

        <label className="block">
          <span className="text-sm text-gray-400">API Proxy URL</span>
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="https://your-worker.workers.dev"
            className="w-full mt-1 px-3 py-2 bg-bg rounded-lg border border-bg-lighter text-gray-100 text-sm focus:outline-none focus:border-warm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-bg rounded-lg border border-bg-lighter text-gray-100 text-sm focus:outline-none focus:border-warm"
          >
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
            <option value="claude-opus-4-0-20250115">Claude Opus 4</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">TTS Speed: {ttsRate.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={ttsRate}
            onChange={(e) => setTtsRate(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">TTS Voice</span>
          <select
            value={ttsVoice}
            onChange={(e) => setTtsVoice(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-bg rounded-lg border border-bg-lighter text-gray-100 text-sm focus:outline-none focus:border-warm"
          >
            <option value="">System Default</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Default Mode</span>
          <select
            value={defaultMode}
            onChange={(e) => setDefaultMode(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-bg rounded-lg border border-bg-lighter text-gray-100 text-sm focus:outline-none focus:border-warm"
          >
            <option value="speech">Speech</option>
            <option value="research">Research</option>
          </select>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-bg-lighter rounded-lg text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button onClick={save} className="flex-1 px-4 py-2 bg-warm text-bg rounded-lg font-medium hover:opacity-90">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
