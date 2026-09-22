import { describe, it, expect } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { useLibrary } from '@/hooks/use-library';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';
import { climbSample } from '@/lib/samples/climb';
import { formatGameTitle } from '@/lib/library/version';

const NOW = '2026-09-21T12:00:00.000Z';

describe('useLibrary', () => {
  it('starts not ready on first render without initialState (SSR hydration parity)', () => {
    const storage = memoryStorage();
    loadLibrary(storage, { now: NOW, id: 'seed-1' });
    let readyDuringRender: boolean | undefined;

    function Probe() {
      const { ready } = useLibrary({
        storage,
        now: () => NOW,
        createId: () => 'x',
      });
      if (readyDuringRender === undefined) readyDuringRender = ready;
      return null;
    }

    render(<Probe />);

    expect(readyDuringRender).toBe(false);
  });

  it('loads from storage after mount when no initialState', () => {
    const storage = memoryStorage();
    loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        now: () => NOW,
        createId: () => 'x',
      }),
    );

    act(() => {});

    expect(result.current.ready).toBe(true);
    expect(result.current.active?.name).toBe('Climb (sample)');
  });

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

  it('deleteActive removes a draft and selects another', () => {
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
      result.current.deleteActive();
    });
    expect(result.current.activeId).toBe('seed-1');
    expect(result.current.drafts.map((d) => d.id)).toEqual(['seed-1']);
    const reloaded = loadLibrary(storage, { now: NOW, id: 'other' });
    expect(reloaded.activeId).toBe('seed-1');
    expect(reloaded.drafts).toHaveLength(1);
  });

  it('deleteActive of the last draft leaves an empty library', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => NOW,
        createId: () => 'x',
      }),
    );

    act(() => {
      result.current.deleteActive();
    });
    expect(result.current.activeId).toBeNull();
    expect(result.current.drafts).toEqual([]);
    expect(result.current.active).toBeUndefined();
    const reloaded = loadLibrary(storage, { now: NOW, id: 'other' });
    expect(reloaded.drafts).toEqual([]);
    expect(reloaded.activeId).toBeNull();
  });

  it('newGame can copy an existing draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T18:00:00.000Z',
        createId: () => 'copy-1',
      }),
    );

    act(() => {
      result.current.newGame({ name: 'From Climb', source: { copyFrom: 'seed-1' } });
    });

    expect(result.current.active?.name).toBe('From Climb');
    expect(result.current.active?.source).toBe('copy');
    expect(result.current.active?.bootstrap.cards).toHaveLength(3);
    expect(result.current.drafts).toHaveLength(2);
  });

  it('publishActive freezes the active game as published v1 with a slug', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-22T21:00:00.000Z',
        createId: () => 'x',
      }),
    );

    act(() => {
      result.current.publishActive();
    });

    expect(result.current.active?.status).toBe('published');
    expect(result.current.active?.version).toBe('1');
    expect(result.current.active?.slug).toBe('climb-sample');
    expect(result.current.active?.publishedAt).toBe('2026-09-22T21:00:00.000Z');
    expect(formatGameTitle(result.current.active!)).toBe('Climb (sample) (Published) v1');
  });

  it('newGame after an empty library does not reseed Climb', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T17:00:00.000Z',
        createId: () => 'blank',
      }),
    );

    act(() => {
      result.current.deleteActive();
    });
    act(() => {
      result.current.newGame({ name: 'Sandbox', source: 'empty' });
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.activeId).toBe('blank');
    expect(result.current.active?.name).toBe('Sandbox');
    expect(result.current.active?.source).toBe('empty');
    const reloaded = loadLibrary(storage, { now: NOW, id: 'other' });
    expect(reloaded.drafts.map((d) => d.source)).toEqual(['empty']);
    expect(reloaded.drafts.some((d) => d.name === 'Climb (sample)')).toBe(false);
  });
});
