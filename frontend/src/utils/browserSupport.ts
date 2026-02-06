export const browserSupport = {
  hasFileSystemAccess(): boolean {
    return 'showDirectoryPicker' in window;
  },

  async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.hasFileSystemAccess()) {
      return null;
    }

    try {
      return await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });
    } catch (error) {
      // User cancelled or error occurred
      console.error('Directory picker error:', error);
      return null;
    }
  },
};
