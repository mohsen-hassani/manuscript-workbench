import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { X } from 'lucide-react';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (filename: string, content: string) => void;
}

export function CreateFileModal({ isOpen, onClose, onCreate }: CreateFileModalProps) {
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) return;
    onCreate(filename, content);
    setFilename('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Create New File</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filename</label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="my-note.md"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">.md extension will be added automatically</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Initial Content (optional)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# My Note&#10;&#10;Start writing..."
              rows={6}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-accent-purple"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!filename.trim()}>
              Create File
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
