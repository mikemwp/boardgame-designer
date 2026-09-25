import { describe, it, expect } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  deleteDraft,
  findPublishedBySlug,
  getActive,
  slugifyName,
  listDrafts,
  parseLibrary,
  publishDocument,
  saveDraft,
  seedLibrary,
  setActive,
  uniquePublishedSlug,
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
    expect(parsed).toEqual({ version: 1, activeId: null, drafts: [], floatingPacks: [], floatingCards: [] });
  });

  it('keeps floating packs and cards, defaulting missing lists to empty', () => {
    const parsed = parseLibrary(
      JSON.stringify({
        version: 1,
        activeId: null,
        drafts: [],
        floatingPacks: [{ id: 'float-pack-1', name: 'odds', cards: [{ id: 'o1', pack: 'odds', title: 'Even' }] }],
        floatingCards: [{ id: 'float-card-1', pack: '', title: 'Loose' }],
      }),
    );
    expect(parsed?.floatingPacks).toEqual([
      { id: 'float-pack-1', name: 'odds', cards: [{ id: 'o1', pack: 'odds', title: 'Even' }] },
    ]);
    expect(parsed?.floatingCards).toEqual([{ id: 'float-card-1', pack: '', title: 'Loose' }]);
    const empty = parseLibrary(JSON.stringify({ version: 1, activeId: null, drafts: [] }));
    expect(empty?.floatingPacks).toEqual([]);
    expect(empty?.floatingCards).toEqual([]);
  });

  it('keeps packBacks on a stored draft', () => {
    const empty = emptyStored();
    const back = { id: 'back-1', name: 'back.png', source: 'url', src: 'https://example.com/back.png' };
    const parsed = parseLibrary(
      JSON.stringify({
        version: 1,
        activeId: 'notes',
        drafts: [
          {
            id: 'notes',
            name: 'Notes',
            createdAt: '2026-09-25T00:00:00.000Z',
            updatedAt: '2026-09-25T00:00:00.000Z',
            lastSaved: '2026-09-25T00:00:00.000Z',
            source: 'empty',
            status: 'draft',
            version: null,
            bootstrap: { ...empty, packs: ['notes'], packBacks: { notes: back } },
          },
        ],
      }),
    );
    expect(parsed?.drafts[0]?.bootstrap.packBacks).toEqual({ notes: back });
  });

  it('keeps an empty pack catalog on a cardless draft', () => {
    const empty = emptyStored();
    const parsed = parseLibrary(
      JSON.stringify({
        version: 1,
        activeId: 'notes',
        drafts: [
          {
            id: 'notes',
            name: 'Notes',
            createdAt: '2026-09-22T18:00:00.000Z',
            updatedAt: '2026-09-22T18:00:00.000Z',
            lastSaved: '2026-09-22T18:00:00.000Z',
            source: 'empty',
            status: 'draft',
            version: null,
            bootstrap: { ...empty, cards: [], packs: ['notes'] },
          },
        ],
      }),
    );
    expect(parsed?.drafts[0]?.bootstrap.cards).toEqual([]);
    expect(parsed?.drafts[0]?.bootstrap.packs).toEqual(['notes']);
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

describe('gameStart persistence', () => {
  it('keeps gameStart when parsing a stored library', () => {
    const doc = createDocument({
      id: 'g1',
      name: 'Intro',
      source: 'empty',
      bootstrap: {
        ...emptyStored(),
        gameStart: {
          splashes: [{ id: 's1', caption: 'Hello' }],
          menu: { items: [] },
        },
      },
      now: '2026-09-23T12:00:00.000Z',
    });
    const raw = JSON.stringify({ version: 1, activeId: 'g1', drafts: [doc] });
    const parsed = parseLibrary(raw);
    expect(parsed?.drafts[0]?.bootstrap.gameStart?.splashes[0]?.caption).toBe('Hello');
  });
});

describe('publish slug', () => {
  function doc(overrides: Partial<ReturnType<typeof createDocument>> = {}) {
    return {
      ...createDocument({
        id: 'g1',
        name: 'Sandbox',
        source: 'empty',
        bootstrap: emptyStored(),
        now: '2026-09-22T12:00:00.000Z',
      }),
      ...overrides,
    };
  }

  it('slugifyName lowercases and hyphenates', () => {
    expect(slugifyName('Climb (sample)')).toBe('climb-sample');
    expect(slugifyName('!!!')).toBe('game');
  });

  it('first publish assigns v1 and a unique slug', () => {
    const published = publishDocument(doc(), '2026-09-22T13:00:00.000Z', 'sandbox');
    expect(published.version).toBe('1');
    expect(published.slug).toBe('sandbox');
    expect(published.status).toBe('published');
  });

  it('later publish keeps the landed version and existing slug', () => {
    const published = publishDocument(
      doc({ version: '1.3', status: 'draft', slug: 'sandbox' }),
      '2026-09-22T16:00:00.000Z',
    );
    expect(published.version).toBe('1.3');
    expect(published.slug).toBe('sandbox');
  });

  it('uniquePublishedSlug suffixes when the base is taken', () => {
    const a = publishDocument(doc({ id: 'a', name: 'Sandbox' }), 't', 'sandbox');
    const state: LibraryState = { version: 1, activeId: 'a', drafts: [a] };
    expect(uniquePublishedSlug(state, 'Sandbox')).toBe('sandbox-2');
    expect(uniquePublishedSlug(state, 'Sandbox', 'a')).toBe('sandbox');
  });

  it('findPublishedBySlug ignores drafts that still hold the slug', () => {
    const live = publishDocument(doc({ id: 'a', name: 'Sandbox' }), 't', 'sandbox');
    const draft = { ...live, id: 'b', status: 'draft' as const, published: false };
    const state: LibraryState = { version: 1, activeId: 'b', drafts: [live, draft] };
    expect(findPublishedBySlug(state, 'sandbox')?.id).toBe('a');
  });

  it('parseLibrary keeps a stored slug', () => {
    const good = createDocument({
      id: 'ok',
      name: 'Ok',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T12:00:00.000Z',
      slug: 'ok-game',
    });
    const parsed = parseLibrary(JSON.stringify({ version: 1, activeId: 'ok', drafts: [good] }));
    expect(parsed?.drafts[0]?.slug).toBe('ok-game');
  });
});
