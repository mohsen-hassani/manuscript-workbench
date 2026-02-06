import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui';
import { ChatMessage } from './ChatMessage';
import { api } from '@/services/api';
import type { ChatMessage as ChatMessageType } from '@/types';

interface AIChatPanelProps {
  projectId: number;
  selectedFileId?: number;
}

export function AIChatPanel({ projectId, selectedFileId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: 'assistant',
      content: `Hello! I'm ready to help you with your manuscript. I can assist with:

- **Literature review** and citation checking
- **Drafting and editing** sections
- **Improving clarity** and academic writing style
- **Generating summaries** and abstracts

What would you like help with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connectWebSocket = () => {
    const token = api.getToken();
    if (!token) return null;

    // Use relative URL so it works in both development and production
    // In production, Nginx will proxy WebSocket connections
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        setStreamingContent('');
        setIsStreaming(true);
      } else if (data.type === 'token') {
        setStreamingContent((prev) => prev + data.content);
      } else if (data.type === 'end') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.full_response },
        ]);
        setStreamingContent('');
        setIsStreaming(false);
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.message);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.message}` },
        ]);
        setIsStreaming(false);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsStreaming(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      wsRef.current = null;
    };

    return ws;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // Connect to WebSocket if not connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      wsRef.current = connectWebSocket();

      if (!wsRef.current) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Failed to connect. Please try again.' },
        ]);
        return;
      }

      // Wait for connection with timeout
      await new Promise<void>((resolve, reject) => {
        if (!wsRef.current) return reject(new Error('WebSocket not initialized'));

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        wsRef.current.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        wsRef.current.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      }).catch((error) => {
        console.error('WebSocket connection failed:', error);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Failed to connect: ${error.message || 'Unknown error'}. Please try again.` },
        ]);
        wsRef.current?.close();
        wsRef.current = null;
        return;
      });
    }

    // Send message
    wsRef.current?.send(JSON.stringify({
      message: userMessage,
      project_id: projectId,
      file_id: selectedFileId,
    }));
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-700">
        <Bot className="w-5 h-5 text-accent-purple" />
        <h2 className="font-semibold text-white">Claude Code Assistant</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        {isStreaming && streamingContent && (
          <ChatMessage role="assistant" content={streamingContent} isStreaming />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-dark-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Claude to help with your manuscript..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent disabled:opacity-50"
          />
          <Button type="submit" disabled={!input.trim() || isStreaming}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
