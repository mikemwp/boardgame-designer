import { describe, it, expect } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addFloatingCard,
  addFloatingPack,
  listCopyCardSources,
  listCopyPackSources,
} from '@/lib/library/floating';
import { createDocument } from '@/lib/library/state';
import { emptyBootstrap } from '@/lib/samples/empty';
import type { LibraryState } from '@/lib/library/types';

function libraryWithTwoGames(): LibraryState {
  const notes = createDocument({
    id: 'g-notes',
    name: 'Notes',
    source: 'empty',
    bootstrap: {
      ...toStoredBootstrap(emptyBootstrap()),
      packs: ['clues'],
      cards: [{ id: 'clues-1', pack: 'clues', title: 'Knock' }],
    },
    now: '2026-09-25T00:00:00.000Z',
  });
  const climb = createDocument({
    id: 'g-climb',
    name: 'Climb (sample)',
    source: 'climb',
    bootstrap: {
      ...toStoredBootstrap(emptyBootstrap()),
      packs: ['climb'],
      cards: [{ id: 'climb-1', pack: 'climb', title: 'Rung' }],
    },
    now: '2026-09-25T00:00:00.000Z',
  });
  return { version: 1, activeId: 'g-notes', drafts: [notes, climb] };
}

describe('floating library', () => {
  it('lists other-game packs with game name and floating packs by name only', () => {
    const withFloat = addFloatingPack(libraryWithTwoGames(), {
      id: 'float-pack-1',
      name: 'odds',
      cards: [{ id: 'odds-1', pack: 'odds', title: 'Even' }],
    });
    expect(listCopyPackSources(withFloat, 'g-notes')).toEqual([
      { kind: 'game', gameId: 'g-climb', gameName: 'Climb (sample)', packName: 'climb' },
      { kind: 'floating', floatingId: 'float-pack-1', packName: 'odds' },
    ]);
    expect(listCopyPackSources(withFloat, 'g-notes').some((row) => 'packName' in row && row.packName === 'clues')).toBe(
      false,
    );
  });

  it('lists other-game cards with game and pack, and floating cards by title only', () => {
    const withFloat = addFloatingCard(libraryWithTwoGames(), { id: 'float-card-1', pack: '', title: 'Loose' });
    expect(listCopyCardSources(withFloat, 'g-notes')).toEqual([
      {
        kind: 'game',
        gameId: 'g-climb',
        gameName: 'Climb (sample)',
        packName: 'climb',
        cardId: 'climb-1',
        cardTitle: 'Rung',
      },
      { kind: 'floating', cardId: 'float-card-1', cardTitle: 'Loose' },
    ]);
  });

  it('assigns unique floating ids when omitted', () => {
    const first = addFloatingPack({ version: 1, activeId: null, drafts: [] }, {
      name: 'odds',
      cards: [],
    });
    const second = addFloatingPack(first, { name: 'evens', cards: [] });
    expect(first.floatingPacks?.[0]?.id).toMatch(/^float-pack-/);
    expect(second.floatingPacks?.[1]?.id).not.toBe(first.floatingPacks?.[0]?.id);
    const withCard = addFloatingCard(second, { pack: '', title: 'Loose' });
    expect(withCard.floatingCards?.[0]?.id).toMatch(/^float-card-/);
  });
});
