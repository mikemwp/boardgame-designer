import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLibrary } from '@/hooks/use-library';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';
import { climbSample } from '@/lib/samples/climb';

const NOW = '2026-09-21T12:00:00.000Z';

describe('useLibrary', () => {
  it('adds a second Climb draft without replacing the seed', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    let n = 1;
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T13:00:00.000Z',
        createId: () => `id-${++n}`,
      }),
    );

    act(() => {
      result.current.newGame({ name: 'Climb two', source: 'climb' });
    });

    expect(result.current.drafts).toHaveLength(2);
    expect(result.current.active?.name).toBe('Climb two');
    expect(result.current.active?.id).toBe('id-2');
    expect(result.current.drafts.some((d) => d.id === 'seed-1')).toBe(true);
    expect(climbSample.cards.deck).toHaveLength(3);
  });

  it('saveActive can persist bootstrap without advancing updatedAt', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-22T16:00:00.000Z',
        createId: () => 'x',
      }),
    );

    act(() => {
      result.current.saveActive(toStoredBootstrap(emptyBootstrap()), { touchUpdatedAt: false });
    });

    expect(result.current.active?.updatedAt).toBe(NOW);
  });

  it('saveActive writes imported cards into the active draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T15:00:00.000Z',
        createId: () => 'x',
      }),
    );
    const stored = toStoredBootstrap(emptyBootstrap());
    stored.cards = [{ id: 'n1', pack: 'notes', title: 'Imported' }];

    act(() => {
      result.current.saveActive(stored);
    });

    expect(result.current.active?.bootstrap.cards).toEqual([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    expect(result.current.active?.updatedAt).toBe('2026-09-21T15:00:00.000Z');
    const reloaded = loadLibrary(storage, { now: NOW, id: 'other' });
    expect(reloaded.drafts[0]?.bootstrap.cards[0]?.title).toBe('Imported');
  });

  it('openGame switches the active draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T16:00:00.000Z',
        createId: () => 'blank',
      }),
    );

    act(() => {
      result.current.newGame({ name: 'Sandbox', source: 'empty' });
    });
    expect(result.current.activeId).toBe('blank');
    act(() => {
      result.current.openGame('seed-1');
    });
    expect(result.current.activeId).toBe('seed-1');
    expect(result.current.active?.name).toBe('Climb (sample)');
  });
});
