import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/services/api';

interface MarkdownViewerProps {
  projectId: number;
  fileId: number;
  filename: string;
}

export function MarkdownViewer({ projectId, fileId, filename }: MarkdownViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getFileContent(projectId, fileId);
        setContent(response.content);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load file content');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [projectId, fileId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        {error}
      </div>
    );
  }

  // Extract title from filename
  const title = filename.replace(/\.(md|txt)$/i, '').replace(/-/g, ' ');

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Document Title */}
        <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>

        {/* Markdown Content */}
        <article className="prose prose-invert prose-lg max-w-none
          prose-headings:text-accent-purple prose-headings:font-semibold
          prose-h1:text-2xl prose-h1:border-b prose-h1:border-dark-700 prose-h1:pb-3
          prose-h2:text-xl prose-h2:text-purple-400
          prose-h3:text-lg
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-accent-purple prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-code:text-pink-400 prose-code:bg-dark-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-dark-700 prose-pre:border prose-pre:border-dark-600
          prose-blockquote:border-accent-purple prose-blockquote:text-gray-400
          prose-ul:text-gray-300 prose-ol:text-gray-300
          prose-li:marker:text-accent-purple
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
