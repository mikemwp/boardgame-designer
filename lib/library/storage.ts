import { parseLibrary, seedLibrary } from '@/lib/library/state';
import {
  LIBRARY_STORAGE_KEY,
  type LibraryState,
} from '@/lib/library/types';

export interface LibraryStorage {
  read(): string | null;
  write(value: string): void;
}

export function memoryStorage(initial: string | null = null): LibraryStorage {
  let data = initial;
  return {
    read: () => data,
    write: (value) => {
      data = value;
    },
  };
}

export function browserStorage(): LibraryStorage {
  return {
    read: () => {
      if (typeof window === 'undefined') return null;
      try {
        return window.localStorage.getItem(LIBRARY_STORAGE_KEY);
      } catch {
        return null;
      }
    },
    write: (value) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(LIBRARY_STORAGE_KEY, value);
      } catch {
        // quota / private mode — keep working in memory only
      }
    },
  };
}

export function writeLibrary(storage: LibraryStorage, state: LibraryState): void {
  storage.write(JSON.stringify(state));
}

export function loadLibrary(
  storage: LibraryStorage,
  opts: { now: string; id: string },
): LibraryState {
  const parsed = parseLibrary(storage.read());
  if (parsed) return parsed;
  const seeded = seedLibrary(opts.now, opts.id);
  writeLibrary(storage, seeded);
  return seeded;
}
