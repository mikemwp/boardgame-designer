import { describe, it, expect } from 'vitest';
import {
  memoryMediaStore,
  isAllowedAudioMime,
  isAllowedImageMime,
  isAllowedVideoMime,
} from '@/lib/library/media-store';

describe('memoryMediaStore', () => {
  it('round-trips a blob and returns undefined after delete', async () => {
    const store = memoryMediaStore();
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' });
    await store.put('g1', 'a1', blob);
    const got = await store.get('g1', 'a1');
    expect(await got?.arrayBuffer()).toEqual(await blob.arrayBuffer());
    await store.delete('g1', 'a1');
    expect(await store.get('g1', 'a1')).toBeUndefined();
  });

  it('copyGame duplicates blobs under a new game id', async () => {
    const store = memoryMediaStore();
    await store.put('g1', 'a1', new Blob(['x'], { type: 'audio/mpeg' }));
    await store.copyGame('g1', 'g2');
    expect(await store.get('g2', 'a1')).toBeDefined();
  });

  it('deleteGame removes every blob for that game', async () => {
    const store = memoryMediaStore();
    await store.put('g1', 'a1', new Blob(['x'], { type: 'audio/mpeg' }));
    await store.put('g1', 'a2', new Blob(['y'], { type: 'audio/mpeg' }));
    await store.put('g2', 'a1', new Blob(['z'], { type: 'audio/mpeg' }));
    await store.deleteGame('g1');
    expect(await store.get('g1', 'a1')).toBeUndefined();
    expect(await store.get('g1', 'a2')).toBeUndefined();
    expect(await store.get('g2', 'a1')).toBeDefined();
  });

  it('rejects unknown mime helpers', () => {
    expect(isAllowedAudioMime('audio/mpeg')).toBe(true);
    expect(isAllowedAudioMime('application/pdf')).toBe(false);
    expect(isAllowedImageMime('image/png')).toBe(true);
    expect(isAllowedVideoMime('video/mp4')).toBe(true);
    expect(isAllowedVideoMime('application/pdf')).toBe(false);
  });
});
