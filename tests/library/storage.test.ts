import { describe, it, expect } from 'vitest';
import {
  browserStorage,
  loadLibrary,
  memoryStorage,
  writeLibrary,
} from '@/lib/library/storage';

const NOW = '2026-09-21T12:00:00.000Z';

describe('memoryStorage + loadLibrary', () => {
  it('seeds Climb when empty and round-trips after write', () => {
    const storage = memoryStorage();
    const seeded = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    expect(seeded.drafts).toHaveLength(1);
    expect(seeded.drafts[0]?.id).toBe('seed-1');
    expect(storage.read()).toContain('Climb (sample)');

    seeded.drafts[0]!.name = 'Renamed';
    writeLibrary(storage, seeded);
    const loaded = loadLibrary(storage, { now: '2026-09-21T99:00:00.000Z', id: 'other' });
    expect(loaded.drafts[0]?.name).toBe('Renamed');
    expect(loaded.drafts[0]?.id).toBe('seed-1');
  });

  it('reseeds when JSON is corrupt', () => {
    const storage = memoryStorage('{not json');
    const seeded = loadLibrary(storage, { now: NOW, id: 'fresh' });
    expect(seeded.activeId).toBe('fresh');
    expect(seeded.drafts).toHaveLength(1);
  });
});

describe('browserStorage', () => {
  it('does not throw when window is missing (node) or present', () => {
    expect(() => {
      const storage = browserStorage();
      storage.write('{"ok":true}');
      storage.read();
    }).not.toThrow();
  });
});
