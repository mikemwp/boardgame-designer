import { describe, it, expect } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  deleteDraft,
  getActive,
  listDrafts,
  parseLibrary,
  saveDraft,
  seedLibrary,
  setActive,
} from '@/lib/library/state';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import type { LibraryState } from '@/lib/library/types';

const climbStored = () => toStoredBootstrap(climbSample);
const emptyStored = () => toStoredBootstrap(emptyBootstrap());

describe('seedLibrary', () => {
  it('inserts one Climb draft and selects it', () => {
    const state = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    expect(state.version).toBe(1);
    expect(state.drafts).toHaveLength(1);
    expect(state.activeId).toBe('seed-1');
    expect(state.drafts[0]?.name).toBe('Climb (sample)');
    expect(state.drafts[0]?.source).toBe('climb');
    expect(state.drafts[0]?.bootstrap.cards).toHaveLength(3);
  });
});

describe('addDraft', () => {
  it('does not overwrite existing drafts', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const extra = createDocument({
      id: 'd2',
      name: 'Blank',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T13:00:00.000Z',
    });
    const next = addDraft(seeded, extra);
    expect(next.drafts.map((d) => d.id)).toEqual(['seed-1', 'd2']);
    expect(next.activeId).toBe('d2');
    expect(getActive(next)?.name).toBe('Blank');
  });
});

describe('saveDraft', () => {
  it('updates bootstrap and updatedAt on the matching id only', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const withEmpty = addDraft(
      seeded,
      createDocument({
        id: 'd2',
        name: 'Blank',
        source: 'empty',
        bootstrap: emptyStored(),
        now: '2026-09-21T13:00:00.000Z',
      }),
    );
    const patched = {
      ...climbStored(),
      cards: [{ id: 'x', pack: 'climb', title: 'Extra' }],
    };
    const saved = saveDraft(withEmpty, 'seed-1', patched, '2026-09-21T14:00:00.000Z');
    expect(saved.drafts.find((d) => d.id === 'seed-1')?.bootstrap.cards).toEqual([
      { id: 'x', pack: 'climb', title: 'Extra' },
    ]);
    expect(saved.drafts.find((d) => d.id === 'seed-1')?.updatedAt).toBe(
      '2026-09-21T14:00:00.000Z',
    );
    expect(saved.drafts.find((d) => d.id === 'd2')?.bootstrap.cards).toEqual([]);
  });

  it('is a no-op for an unknown id', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const next = saveDraft(seeded, 'missing', emptyStored(), '2026-09-21T14:00:00.000Z');
    expect(next).toEqual(seeded);
  });
});

describe('setActive and listDrafts', () => {
  it('switches active and lists newest updated first', () => {
    const a = createDocument({
      id: 'a',
      name: 'A',
      source: 'climb',
      bootstrap: climbStored(),
      now: '2026-09-21T10:00:00.000Z',
    });
    const b = createDocument({
      id: 'b',
      name: 'B',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T11:00:00.000Z',
    });
    let state: LibraryState = { version: 1, activeId: 'a', drafts: [a, b] };
    state = setActive(state, 'b');
    expect(state.activeId).toBe('b');
    expect(setActive(state, 'nope').activeId).toBe('b');
    const listed = listDrafts(state);
    expect(listed.map((d) => d.id)).toEqual(['b', 'a']);
  });
});

describe('parseLibrary', () => {
  it('returns null for junk, wrong version, or missing drafts', () => {
    expect(parseLibrary(null)).toBeNull();
    expect(parseLibrary('{')).toBeNull();
    expect(parseLibrary(JSON.stringify({ version: 2, activeId: null, drafts: [] }))).toBeNull();
    expect(parseLibrary(JSON.stringify({ version: 1, activeId: null, drafts: 'nope' }))).toBeNull();
  });

  it('keeps valid drafts and drops malformed ones', () => {
    const good = createDocument({
      id: 'ok',
      name: 'Ok',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T12:00:00.000Z',
    });
    const parsed = parseLibrary(
      JSON.stringify({
        version: 1,
        activeId: 'ok',
        drafts: [good, { id: 'bad' }, { ...good, bootstrap: { nope: true } }],
      }),
    );
    expect(parsed?.drafts).toHaveLength(1);
    expect(parsed?.drafts[0]?.id).toBe('ok');
    expect(parsed?.activeId).toBe('ok');
  });

  it('keeps an empty library instead of treating it as missing', () => {
    const parsed = parseLibrary(JSON.stringify({ version: 1, activeId: null, drafts: [] }));
    expect(parsed).toEqual({ version: 1, activeId: null, drafts: [] });
  });

  it('migrates legacy documents to draft metadata', () => {
    const good = createDocument({
      id: 'ok',
      name: 'Ok',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T12:00:00.000Z',
    });
    const legacy = {
      id: good.id,
      name: good.name,
      createdAt: good.createdAt,
      updatedAt: good.updatedAt,
      source: good.source,
      bootstrap: good.bootstrap,
    };
    const parsed = parseLibrary(JSON.stringify({ version: 1, activeId: 'ok', drafts: [legacy] }));
    expect(parsed?.drafts[0]?.status).toBe('draft');
    expect(parsed?.drafts[0]?.version).toBeNull();
    expect(parsed?.drafts[0]?.lastSaved).toBe(good.updatedAt);
  });
});

describe('deleteDraft', () => {
  it('removes a draft and selects the newest remaining', () => {
    const a = createDocument({
      id: 'a',
      name: 'A',
      source: 'climb',
      bootstrap: climbStored(),
      now: '2026-09-21T10:00:00.000Z',
    });
    const b = createDocument({
      id: 'b',
      name: 'B',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T11:00:00.000Z',
    });
    const state: LibraryState = { version: 1, activeId: 'b', drafts: [a, b] };
    const next = deleteDraft(state, 'b');
    expect(next.drafts.map((d) => d.id)).toEqual(['a']);
    expect(next.activeId).toBe('a');
    expect(getActive(next)?.id).toBe('a');
  });

  it('leaves an empty create state with no dangling activeId', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const next = deleteDraft(seeded, 'seed-1');
    expect(next.drafts).toEqual([]);
    expect(next.activeId).toBeNull();
    expect(getActive(next)).toBeUndefined();
  });

  it('refuses to delete a published game', () => {
    const published = createDocument({
      id: 'live',
      name: 'Live',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T12:00:00.000Z',
      published: true,
    });
    const draft = createDocument({
      id: 'draft',
      name: 'Draft',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T13:00:00.000Z',
    });
    const state: LibraryState = { version: 1, activeId: 'live', drafts: [published, draft] };
    expect(deleteDraft(state, 'live')).toEqual(state);
    expect(deleteDraft(state, 'draft').drafts.map((d) => d.id)).toEqual(['live']);
  });
});
