import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../lib/api';

export function useClaude() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (userContent, systemPrompt, contextFiles = []) => {
    const content = [];

    for (const file of contextFiles) {
      if (file.type === 'text') {
        content.push({
          type: 'text',
          text: `[File: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\``,
        });
      } else if (file.type === 'image') {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: file.mimeType, data: file.base64 },
        });
      } else if (file.type === 'pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: file.base64 },
        });
      }
    }

    content.push({ type: 'text', text: userContent });

    const userMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingText('');

    const apiMessages = newMessages.map((m) => {
      if (typeof m.content === 'string') return m;
      // For display messages, extract text only
      return m;
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fullText = await streamChat(
        apiMessages,
        systemPrompt,
        (_chunk, full) => setStreamingText(full),
        () => {},
        controller.signal
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      setStreamingText('');
      return fullText;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      const errorMsg = `Error: ${err.message}`;
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      setStreamingText('');
      throw err;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    streamingText,
    sendMessage,
    stopStreaming,
    resetConversation,
  };
}
