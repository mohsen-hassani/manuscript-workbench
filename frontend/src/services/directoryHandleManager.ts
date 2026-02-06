import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DirectoryHandleDB extends DBSchema {
  directoryHandles: {
    key: number; // projectId
    value: {
      handle: FileSystemDirectoryHandle;
      path: string;
      grantedAt: string;
    };
  };
}

class DirectoryHandleManager {
  private db: IDBPDatabase<DirectoryHandleDB> | null = null;

  async init() {
    if (this.db) return;

    this.db = await openDB<DirectoryHandleDB>('manuscriptWorkbench', 1, {
      upgrade(db) {
        db.createObjectStore('directoryHandles');
      },
    });
  }

  async saveDirectoryHandle(
    projectId: number,
    handle: FileSystemDirectoryHandle
  ): Promise<void> {
    await this.init();
    await this.db!.put('directoryHandles', {
      handle,
      path: handle.name,
      grantedAt: new Date().toISOString(),
    }, projectId);
  }

  async getDirectoryHandle(projectId: number): Promise<FileSystemDirectoryHandle | null> {
    await this.init();
    const data = await this.db!.get('directoryHandles', projectId);
    return data?.handle || null;
  }

  async removeDirectoryHandle(projectId: number): Promise<void> {
    await this.init();
    await this.db!.delete('directoryHandles', projectId);
  }

  async verifyPermission(
    handle: FileSystemDirectoryHandle,
    mode: 'read' | 'readwrite' = 'readwrite'
  ): Promise<boolean> {
    const permission = await handle.queryPermission({ mode });
    if (permission === 'granted') return true;

    const newPermission = await handle.requestPermission({ mode });
    return newPermission === 'granted';
  }

  async getFileHandle(
    dirHandle: FileSystemDirectoryHandle,
    filename: string
  ): Promise<FileSystemFileHandle | null> {
    try {
      return await dirHandle.getFileHandle(filename);
    } catch (error) {
      // File doesn't exist in directory
      return null;
    }
  }

  async readFile(fileHandle: FileSystemFileHandle): Promise<File> {
    return await fileHandle.getFile();
  }

  async writeFile(fileHandle: FileSystemFileHandle, content: string | Blob): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
}

export const directoryHandleManager = new DirectoryHandleManager();
