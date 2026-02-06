import { useState } from 'react';
import { AIChatPanel } from './AIChatPanel';
import { FileTree } from './FileTree';
import { MarkdownViewer } from './MarkdownViewer';

interface WorkspaceLayoutProps {
  projectId: number;
}

export function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  const [selectedFile, setSelectedFile] = useState<{ id: number; name: string } | null>(null);

  const handleFileSelect = (fileId: number, filename: string) => {
    setSelectedFile({ id: fileId, name: filename });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel - AI Chat */}
      <div className="w-[45%] bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <AIChatPanel
          projectId={projectId}
          selectedFileId={selectedFile?.id}
        />
      </div>

      {/* Right Panel - File Tree + Viewer */}
      <div className="flex-1 flex flex-col gap-4">
        {/* File Tree */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden flex-shrink-0">
          <FileTree
            projectId={projectId}
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFile?.id}
          />
        </div>

        {/* Markdown Viewer */}
        <div className="flex-1 bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          {selectedFile ? (
            <MarkdownViewer
              projectId={projectId}
              fileId={selectedFile.id}
              filename={selectedFile.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">Select a file to view</p>
              <p className="text-sm mt-2">Choose a markdown file from the vault</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
