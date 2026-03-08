const DEFAULT_PROXY_URL = '/api/claude';

export function getProxyUrl() {
  return localStorage.getItem('proxyUrl') || DEFAULT_PROXY_URL;
}

export function getModel() {
  return localStorage.getItem('model') || 'claude-sonnet-4-20250514';
}

export async function streamChat(messages, systemPrompt, onChunk, onDone, signal) {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    throw new Error('Please configure your API proxy URL in Settings.');
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 8192,
      stream: true,
      system: systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const data = JSON.parse(raw);
          if (data.type === 'content_block_delta' && data.delta?.text) {
            fullText += data.delta.text;
            onChunk(data.delta.text, fullText);
          }
          if (data.type === 'message_stop') {
            onDone(fullText);
            return fullText;
          }
          if (data.type === 'error') {
            throw new Error(data.error?.message || 'Stream error');
          }
        } catch (e) {
          if (e.message === 'Stream error' || e.message?.includes('API error')) throw e;
        }
      }
    }
  }

  onDone(fullText);
  return fullText;
}
