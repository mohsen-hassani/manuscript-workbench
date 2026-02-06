import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { X, Folder, AlertCircle } from 'lucide-react';
import { browserSupport } from '@/utils/browserSupport';

interface DirectoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectorySelected: (handle: FileSystemDirectoryHandle) => void;
}

export function DirectoryPickerModal({
  isOpen,
  onClose,
  onDirectorySelected
}: DirectoryPickerModalProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const isSupported = browserSupport.hasFileSystemAccess();

  if (!isOpen) return null;

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    try {
      const handle = await browserSupport.requestDirectoryAccess();
      if (handle) {
        onDirectorySelected(handle);
        onClose();
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      alert('Failed to select directory. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Set Obsidian Vault Directory</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSupported ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Browser Not Supported</p>
                <p>
                  The File System Access API is only supported in Chrome 86+ and Edge 86+.
                  Please use a compatible browser or continue with manual file selection.
                </p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                Select your Obsidian vault directory to enable automatic file synchronization.
              </p>
              <p className="text-gray-400">
                This will allow the app to read and write markdown files directly without
                repeated file picker dialogs.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200">
                <p className="font-medium mb-1">Permission Required</p>
                <p>
                  You'll need to grant read/write permission to the directory.
                  This permission must be re-granted each time you visit the page.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSelectDirectory}
                disabled={isSelecting}
                className="flex-1"
              >
                <Folder className="w-4 h-4 mr-2" />
                {isSelecting ? 'Selecting...' : 'Select Directory'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
