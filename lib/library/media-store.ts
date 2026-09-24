export const MEDIA_DB = 'building-board.media.v1';
export const MEDIA_STORE = 'blobs';
export const AUDIO_SIZE_WARN_BYTES = 5 * 1024 * 1024;

const ALLOWED_AUDIO = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
]);

const ALLOWED_IMAGE = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export class MediaStoreError extends Error {
  constructor(message = 'Could not store the file on this device.') {
    super(message);
    this.name = 'MediaStoreError';
  }
}

export interface MediaStore {
  put(gameId: string, assetId: string, blob: Blob): Promise<void>;
  get(gameId: string, assetId: string): Promise<Blob | undefined>;
  delete(gameId: string, assetId: string): Promise<void>;
  deleteGame(gameId: string): Promise<void>;
  copyGame(fromId: string, toId: string): Promise<void>;
}

export function isAllowedAudioMime(mime: string): boolean {
  return ALLOWED_AUDIO.has(mime);
}

const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_IMAGE.has(mime);
}

export function isAllowedVideoMime(mime: string): boolean {
  return ALLOWED_VIDEO.has(mime);
}

export function mediaKey(gameId: string, assetId: string): string {
  return `${gameId}/${assetId}`;
}

export function objectUrlFor(blob: Blob): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }
  return `blob:memory-${blob.size}`;
}

export function memoryMediaStore(initial?: Map<string, Blob>): MediaStore {
  const blobs = initial ?? new Map<string, Blob>();
  return {
    async put(gameId, assetId, blob) {
      blobs.set(mediaKey(gameId, assetId), blob);
    },
    async get(gameId, assetId) {
      return blobs.get(mediaKey(gameId, assetId));
    },
    async delete(gameId, assetId) {
      blobs.delete(mediaKey(gameId, assetId));
    },
    async deleteGame(gameId) {
      const prefix = `${gameId}/`;
      for (const key of [...blobs.keys()]) {
        if (key.startsWith(prefix)) blobs.delete(key);
      }
    },
    async copyGame(fromId, toId) {
      const prefix = `${fromId}/`;
      for (const [key, blob] of blobs) {
        if (!key.startsWith(prefix)) continue;
        blobs.set(`${toId}/${key.slice(prefix.length)}`, blob);
      }
    },
  };
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new MediaStoreError());
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      const err = request.error;
      if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        reject(new MediaStoreError());
        return;
      }
      reject(err ?? new MediaStoreError());
    };
  });
}

export function browserMediaStore(): MediaStore {
  const noIdb = typeof indexedDB === 'undefined';
  if (noIdb) {
    return {
      async put() {},
      async get() {
        return undefined;
      },
      async delete() {},
      async deleteGame() {},
      async copyGame() {},
    };
  }
  return {
    async put(gameId, assetId, blob) {
      const db = await openMediaDb();
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).put(blob, mediaKey(gameId, assetId));
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => {
            const err = tx.error;
            if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              reject(new MediaStoreError());
              return;
            }
            reject(err ?? new MediaStoreError());
          };
          tx.onabort = () => {
            const err = tx.error;
            if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              reject(new MediaStoreError());
              return;
            }
            reject(err ?? new MediaStoreError());
          };
        });
      } finally {
        db.close();
      }
    },
    async get(gameId, assetId) {
      const db = await openMediaDb();
      try {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const value = await idbRequest(tx.objectStore(MEDIA_STORE).get(mediaKey(gameId, assetId)));
        return value instanceof Blob ? value : undefined;
      } finally {
        db.close();
      }
    },
    async delete(gameId, assetId) {
      const db = await openMediaDb();
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).delete(mediaKey(gameId, assetId));
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new MediaStoreError());
        });
      } finally {
        db.close();
      }
    },
    async deleteGame(gameId) {
      const db = await openMediaDb();
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        const keys = await idbRequest(store.getAllKeys());
        const prefix = `${gameId}/`;
        for (const key of keys) {
          if (typeof key === 'string' && key.startsWith(prefix)) store.delete(key);
        }
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new MediaStoreError());
        });
      } finally {
        db.close();
      }
    },
    async copyGame(fromId, toId) {
      const db = await openMediaDb();
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        const keys = await idbRequest(store.getAllKeys());
        const prefix = `${fromId}/`;
        for (const key of keys) {
          if (typeof key !== 'string' || !key.startsWith(prefix)) continue;
          const blob = await idbRequest(store.get(key));
          if (blob instanceof Blob) {
            store.put(blob, `${toId}/${key.slice(prefix.length)}`);
          }
        }
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => {
            const err = tx.error;
            if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              reject(new MediaStoreError());
              return;
            }
            reject(err ?? new MediaStoreError());
          };
        });
      } finally {
        db.close();
      }
    },
  };
}
