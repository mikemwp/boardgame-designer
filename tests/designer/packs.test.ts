import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { setCellPack } from '@/lib/designer/mutate';
import {
  addCard,
  cardsInPack,
  createPack,
  deleteCard,
  deletePack,
  listDraftPackIds,
  nextCardId,
  nextPackId,
  renamePack,
  updateCard,
} from '@/lib/designer/packs';
import type { Card } from '@/lib/engine/types';

const rung: Card = { id: 'climb-1', pack: 'climb', title: 'Rung', body: 'Up' };

describe('listDraftPackIds', () => {
  it('unions catalog ids with card packs and keeps an empty pack', () => {
    expect(listDraftPackIds([], [])).toEqual([]);
    expect(listDraftPackIds([rung], ['notes'])).toEqual(['climb', 'notes']);
    expect(listDraftPackIds([], ['notes'])).toEqual(['notes']);
  });
});

describe('createPack and ids', () => {
  it('adds a trimmed unique pack and suggests the next id', () => {
    expect(nextPackId([])).toBe('pack-1');
    expect(nextPackId(['pack-1'])).toBe('pack-2');
    expect(createPack([], ' notes ')).toEqual(['notes']);
    expect(createPack(['notes'], 'notes')).toEqual(['notes']);
    expect(createPack(['notes'], '  ')).toEqual(['notes']);
  });
});

describe('renamePack and deletePack', () => {
  it('rewrites cards and tile packIds, then delete clears both', () => {
    const board = setCellPack(
      createBoard([createLoopedFloor('ground', 'Level 1', 0)], []),
      'ground',
      'ground-c1',
      'notes',
    );
    const renamed = renamePack({
      packIds: ['notes'],
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue' }],
      board,
      from: 'notes',
      to: 'clues',
    });
    expect(renamed.packIds).toEqual(['clues']);
    expect(renamed.cards[0]?.pack).toBe('clues');
    expect(renamed.board.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBe('clues');

    const deleted = deletePack({
      packIds: renamed.packIds,
      cards: renamed.cards,
      board: renamed.board,
      packId: 'clues',
    });
    expect(deleted.packIds).toEqual([]);
    expect(deleted.cards).toEqual([]);
    expect(deleted.board.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBeUndefined();
  });
});

describe('cards', () => {
  it('adds, updates, and deletes a titled card', () => {
    const added = addCard([], { id: nextCardId([], 'notes'), pack: 'notes', title: 'Clue' });
    expect(added).toEqual([{ id: 'notes-1', pack: 'notes', title: 'Clue' }]);
    expect(addCard(added, { id: 'x', pack: 'notes', title: '  ' })).toEqual(added);
    const updated = updateCard(added, 'notes-1', { title: 'Door', body: 'Knock' });
    expect(updated[0]).toMatchObject({ title: 'Door', body: 'Knock' });
    expect(updateCard(updated, 'notes-1', { title: '  ' })).toEqual(updated);
    expect(cardsInPack(updated, 'notes')).toHaveLength(1);
    expect(deleteCard(updated, 'notes-1')).toEqual([]);
  });
});
