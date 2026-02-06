import { useEffect, useState } from 'react';
import { FolderSync, RefreshCw, Plus, Folder, FolderCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/services/api';
import { FileTreeItem } from './FileTreeItem';
import { CreateFileModal } from './CreateFileModal';
import { DirectoryPickerModal } from './DirectoryPickerModal';
import { fileSyncStorage } from '@/services/fileSyncStorage';
import { calculateFileHash, calculateContentHash } from '@/utils/fileHash';
import { directoryHandleManager } from '@/services/directoryHandleManager';
import { browserSupport } from '@/utils/browserSupport';
import type { FileInfo, PermissionStatus } from '@/types';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  fileId?: number;
}

interface FileTreeProps {
  projectId: number;
  onFileSelect: (fileId: number, filename: string) => void;
  selectedFileId?: number;
}

function buildFileTree(files: FileInfo[]): TreeNode[] {
  // Create default folder structure
  const folders: Record<string, TreeNode> = {
    'Manuscripts': { id: 'manuscripts', name: 'Manuscripts', type: 'folder', children: [] },
    'Literature Notes': { id: 'literature', name: 'Literature Notes', type: 'folder', children: [] },
    'References': { id: 'references', name: 'References', type: 'folder', children: [] },
  };

  // Sort files into folders based on extension or name patterns
  files.forEach((file) => {
    const node: TreeNode = {
      id: `file-${file.id}`,
      name: file.original_filename,
      type: 'file',
      fileId: file.id,
    };

    const filename = file.original_filename.toLowerCase();

    if (filename.includes('reference') || filename.endsWith('.bib')) {
      folders['References'].children!.push(node);
    } else if (filename.includes('note') || filename.includes('literature')) {
      folders['Literature Notes'].children!.push(node);
    } else {
      folders['Manuscripts'].children!.push(node);
    }
  });

  // Only include non-empty folders
  return Object.values(folders).filter(f => f.children && f.children.length > 0);
}

export function FileTree({ projectId, onFileSelect, selectedFileId }: FileTreeProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [baseFolderPath, setBaseFolderPath] = useState<string>('');
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [syncingFileId, setSyncingFileId] = useState<number | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unsupported');
  const [isDirectoryPickerOpen, setIsDirectoryPickerOpen] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await api.getProjectFiles(projectId);
      setFiles(response.files);
      setTreeData(buildFileTree(response.files));
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchProjectDetails();
    loadDirectoryHandle();
  }, [projectId]);

  const loadDirectoryHandle = async () => {
    if (!browserSupport.hasFileSystemAccess()) {
      setPermissionStatus('unsupported');
      return;
    }

    const handle = await directoryHandleManager.getDirectoryHandle(projectId);
    if (handle) {
      setDirectoryHandle(handle);
      const hasPermission = await directoryHandleManager.verifyPermission(handle);
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
    } else {
      setPermissionStatus('prompt');
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const project = await api.getProject(projectId);
      setBaseFolderPath(project.base_folder_path || '');
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  useEffect(() => {
    if (selectedFileId) {
      setSelectedNodeId(`file-${selectedFileId}`);
    }
  }, [selectedFileId]);

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    if (node.type === 'file' && node.fileId) {
      onFileSelect(node.fileId, node.name);
    }
  };

  const handleDirectorySelected = async (handle: FileSystemDirectoryHandle) => {
    await directoryHandleManager.saveDirectoryHandle(projectId, handle);
    setDirectoryHandle(handle);

    const hasPermission = await directoryHandleManager.verifyPermission(handle);
    setPermissionStatus(hasPermission ? 'granted' : 'denied');

    if (hasPermission) {
      alert(`✓ Directory "${handle.name}" set successfully!`);
    }
  };

  const handleRequestPermission = async () => {
    if (!directoryHandle) return;

    const hasPermission = await directoryHandleManager.verifyPermission(directoryHandle);
    setPermissionStatus(hasPermission ? 'granted' : 'denied');

    if (!hasPermission) {
      alert('⚠️ Permission denied. Falling back to manual file selection.');
    }
  };

  // First-time sync (no metadata) - download from server
  const handleFirstTimeSync = async (fileId: number, file: FileInfo) => {
    const blob = await api.downloadFile(projectId, fileId);
    const content = await blob.text();
    const hash = await calculateContentHash(content);

    // Try to write to directory if available
    if (directoryHandle && permissionStatus === 'granted') {
      const fileHandle = await directoryHandleManager.getFileHandle(
        directoryHandle,
        file.original_filename
      );

      if (fileHandle) {
        // File exists in directory - write to it
        await directoryHandleManager.writeFile(fileHandle, content);
        fileSyncStorage.save(fileId, file.version, hash, file.original_filename);
        alert(`✓ Synced ${file.original_filename} to vault (v${file.version})`);
        return;
      }
    }

    // Fall back to browser download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.original_filename;
    a.click();
    window.URL.revokeObjectURL(url);

    fileSyncStorage.save(fileId, file.version, hash, file.original_filename);
    alert(`Downloaded ${file.original_filename}. Version ${file.version} tracked.`);
  };

  // Sync using File System Access API
  const handleSyncWithDirectoryAccess = async (
    fileId: number,
    file: FileInfo,
    syncMetadata: any
  ) => {
    // Verify permission
    const hasPermission = await directoryHandleManager.verifyPermission(directoryHandle!);
    if (!hasPermission) {
      setPermissionStatus('denied');
      await handleSyncWithManualPicker(fileId, file, syncMetadata);
      return;
    }

    // Get file handle from directory
    const fileHandle = await directoryHandleManager.getFileHandle(
      directoryHandle!,
      syncMetadata.filename
    );

    if (!fileHandle) {
      alert(`⚠️ File "${syncMetadata.filename}" not found in vault directory. Please add it or use manual sync.`);
      return;
    }

    // Read local file
    const localFile = await directoryHandleManager.readFile(fileHandle);
    const currentHash = await calculateFileHash(localFile);

    // No changes detected
    if (currentHash === syncMetadata.hash) {
      const serverFile = files.find(f => f.id === fileId);
      if (!serverFile) return;

      if (serverFile.version > syncMetadata.version) {
        // Server has newer version - download and write to file
        const blob = await api.downloadFile(projectId, fileId);
        const content = await blob.text();
        const newHash = await calculateContentHash(content);

        await directoryHandleManager.writeFile(fileHandle, content);
        fileSyncStorage.update(fileId, serverFile.version, newHash);
        alert(`✓ Downloaded newer version to vault (v${serverFile.version})`);
      } else {
        alert('✓ File is up to date');
      }
      return;
    }

    // Changes detected - upload to server
    const newVersion = syncMetadata.version + 1;

    try {
      await api.updateFile(projectId, fileId, localFile, newVersion);
      fileSyncStorage.update(fileId, newVersion, currentHash);
      alert(`✓ Uploaded successfully. New version: ${newVersion}`);
      fetchFiles();
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Version conflict - download newer version
        const blob = await api.downloadFile(projectId, fileId);
        const content = await blob.text();
        const serverFile = files.find(f => f.id === fileId);

        if (serverFile) {
          const newHash = await calculateContentHash(content);
          await directoryHandleManager.writeFile(fileHandle, content);
          fileSyncStorage.update(fileId, serverFile.version, newHash);
          alert(`⚠️ Server had newer version. Downloaded and overwrote local file (v${serverFile.version})`);
        }
      } else {
        throw error;
      }
    }
  };

  // Sync using manual file picker (fallback)
  const handleSyncWithManualPicker = async (
    fileId: number,
    file: FileInfo,
    syncMetadata: any
  ) => {
    // Open file picker to select local file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';

    input.onchange = async (e) => {
      const selectedFile = (e.target as HTMLInputElement).files?.[0];
      if (!selectedFile) return;

      try {
        // Calculate hash of current file
        const currentHash = await calculateFileHash(selectedFile);

        // No changes detected
        if (currentHash === syncMetadata.hash) {
          // Check if server has newer version
          const serverFile = files.find(f => f.id === fileId);
          if (!serverFile) return;

          if (serverFile.version > syncMetadata.version) {
            // Server has newer version - download it
            const blob = await api.downloadFile(projectId, fileId);
            const content = await blob.text();
            const newHash = await calculateContentHash(content);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.original_filename;
            a.click();
            window.URL.revokeObjectURL(url);

            fileSyncStorage.update(fileId, serverFile.version, newHash);
            alert(`Downloaded newer version (v${serverFile.version})`);
          } else {
            // Up to date
            alert('✓ File is up to date');
          }
          return;
        }

        // Changes detected - upload with version check
        const newVersion = syncMetadata.version + 1;

        try {
          await api.updateFile(projectId, fileId, selectedFile, newVersion);

          // Success - update localStorage
          fileSyncStorage.update(fileId, newVersion, currentHash);
          alert(`✓ Uploaded successfully. New version: ${newVersion}`);

          // Refresh file list
          fetchFiles();
        } catch (error: any) {
          if (error.response?.status === 409) {
            // Version conflict
            alert('⚠️ Server has a newer version. Please download the latest version first.');
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
        alert('Failed to sync file');
      }
    };

    input.click();
  };

  const handleSync = async (fileId: number) => {
    if (syncingFileId) return;
    setSyncingFileId(fileId);

    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const syncMetadata = fileSyncStorage.get(fileId);

      // First time - download and track
      if (!syncMetadata) {
        await handleFirstTimeSync(fileId, file);
        return;
      }

      // Try File System Access API first
      if (directoryHandle && permissionStatus === 'granted') {
        await handleSyncWithDirectoryAccess(fileId, file, syncMetadata);
      } else {
        // Fall back to manual file picker
        await handleSyncWithManualPicker(fileId, file, syncMetadata);
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Failed to sync file');
    } finally {
      setSyncingFileId(null);
    }
  };

  const handleSyncAllFiles = async () => {
    if (!directoryHandle || permissionStatus !== 'granted') {
      alert('⚠️ Please set vault directory first');
      return;
    }

    setIsSyncingAll(true);

    let synced = 0;
    let failed = 0;

    for (const file of files) {
      try {
        await handleSync(file.id);
        synced++;
      } catch (error) {
        console.error(`Failed to sync ${file.original_filename}:`, error);
        failed++;
      }
    }

    setIsSyncingAll(false);
    alert(`✓ Sync complete: ${synced} files synced, ${failed} failed`);
  };

  const handleCreateFile = async (filename: string, content: string) => {
    // Check 1: Permission
    if (browserSupport.hasFileSystemAccess() && (!directoryHandle || permissionStatus !== 'granted')) {
      const shouldSetDirectory = confirm(
        '⚠️ Directory permission not granted.\n\n' +
        'Would you like to set your Obsidian vault directory now?\n\n' +
        'This will enable automatic file synchronization.'
      );

      if (shouldSetDirectory) {
        setIsDirectoryPickerOpen(true);
      }
      return;
    }

    // Check 2: Base folder path
    if (!baseFolderPath) {
      const shouldSetBasePath = confirm(
        '⚠️ Project base directory not configured.\n\n' +
        'The Obsidian vault base directory is required for file creation.\n\n' +
        'Would you like to configure it now in Project Settings?'
      );

      if (shouldSetBasePath) {
        alert(
          'Please:\n' +
          '1. Close this workspace\n' +
          '2. Go to Projects page\n' +
          '3. Click "Edit" on this project\n' +
          '4. Set the "Obsidian Vault Base Directory" field\n' +
          '5. Return to workspace'
        );
      }
      return;
    }

    try {
      // Step 1: Create file on server
      const createdFile = await api.createFile(projectId, filename, content);

      // Step 2: Write to local Obsidian vault (if directory handle available)
      if (directoryHandle && permissionStatus === 'granted') {
        try {
          // Get or create file handle in vault directory
          const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });

          // Write content to file
          await directoryHandleManager.writeFile(fileHandle, content);

          // Track in localStorage for sync
          const hash = await calculateContentHash(content);
          fileSyncStorage.save(createdFile.id, createdFile.version, hash, filename);

          alert(`✓ Created ${filename} on server and in your vault`);
        } catch (error) {
          console.error('Failed to write to vault:', error);
          alert(`✓ Created ${filename} on server, but failed to write to vault. You can sync it later.`);
        }
      } else {
        // No directory handle - only created on server
        alert(`✓ Created ${filename} on server (not written to vault - no permission)`);
      }

      setIsCreateFileModalOpen(false);
      await fetchFiles();
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file on server');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <FolderSync className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-white">Obsidian Vault</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchFiles}
            className="p-1.5 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Directory Status */}
      {browserSupport.hasFileSystemAccess() && (
        <div className="p-3 border-b border-dark-700 space-y-2">
          {!directoryHandle ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsDirectoryPickerOpen(true)}
              className="w-full"
            >
              <Folder className="w-3 h-3 mr-2" />
              Set Vault Directory
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Vault Directory:</span>
                {permissionStatus === 'granted' ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <FolderCheck className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Permission needed</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate" title={directoryHandle.name}>
                📁 {directoryHandle.name}
              </div>
              {permissionStatus === 'denied' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRequestPermission}
                  className="w-full text-xs"
                >
                  Re-grant Permission
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-3 border-b border-dark-700">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsCreateFileModalOpen(true)}
          className="flex-1"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create
        </Button>
        {directoryHandle && permissionStatus === 'granted' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSyncAllFiles}
            disabled={isSyncingAll || files.length === 0}
            className="flex-1"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncingAll ? 'animate-spin' : ''}`} />
            {isSyncingAll ? 'Syncing...' : 'Sync All'}
          </Button>
        )}
      </div>

      {/* Base Folder Path Display (optional) */}
      {baseFolderPath && (
        <div className="px-3 py-2 border-b border-dark-700">
          <div className="text-xs text-gray-500">Base Folder:</div>
          <div className="text-xs text-gray-400 truncate" title={baseFolderPath}>
            {baseFolderPath}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-purple"></div>
          </div>
        ) : treeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>No files yet.</p>
            <p className="mt-1">Upload markdown files to get started.</p>
          </div>
        ) : (
          treeData.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              level={0}
              selectedId={selectedNodeId}
              onSelect={handleNodeSelect}
              onSync={handleSync}
            />
          ))
        )}
      </div>

      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />

      <DirectoryPickerModal
        isOpen={isDirectoryPickerOpen}
        onClose={() => setIsDirectoryPickerOpen(false)}
        onDirectorySelected={handleDirectorySelected}
      />
    </div>
  );
}
