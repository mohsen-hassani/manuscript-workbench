import { Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={clsx(
      'flex gap-3 p-4 rounded-lg',
      isUser ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'bg-dark-700'
    )}>
      <div className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-accent-purple' : 'bg-dark-600'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-accent-purple" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'text-xs font-medium mb-1',
          isUser ? 'text-purple-400' : 'text-gray-400'
        )}>
          {isUser ? 'You' : 'Claude'}
        </p>
        <div className="text-gray-200 text-sm prose prose-invert prose-sm max-w-none">
          {isUser ? (
            <p>{content}</p>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-accent-purple animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}
