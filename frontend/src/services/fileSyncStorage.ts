interface FileSyncMetadata {
  version: number;
  hash: string;
  downloadedAt: string;
  filename: string;
}

const STORAGE_PREFIX = 'fileSync_';

export const fileSyncStorage = {
  save(fileId: number, version: number, hash: string, filename: string) {
    const metadata: FileSyncMetadata = {
      version,
      hash,
      downloadedAt: new Date().toISOString(),
      filename,
    };
    localStorage.setItem(`${STORAGE_PREFIX}${fileId}`, JSON.stringify(metadata));
  },

  get(fileId: number): FileSyncMetadata | null {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${fileId}`);
    return data ? JSON.parse(data) : null;
  },

  update(fileId: number, version: number, hash: string) {
    const existing = this.get(fileId);
    if (existing) {
      existing.version = version;
      existing.hash = hash;
      localStorage.setItem(`${STORAGE_PREFIX}${fileId}`, JSON.stringify(existing));
    }
  },

  remove(fileId: number) {
    localStorage.removeItem(`${STORAGE_PREFIX}${fileId}`);
  },
};
