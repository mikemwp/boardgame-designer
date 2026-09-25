import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { setCellPack } from '@/lib/designer/mutate';
import {
  addCard,
  cardBackImage,
  cardsInPack,
  copyCard,
  copyPack,
  createPack,
  deleteCard,
  deletePack,
  listDraftPackIds,
  nextCardId,
  nextPackId,
  removeCard,
  removePack,
  renamePack,
  setPackBack,
  uniquePackName,
  updateCard,
} from '@/lib/designer/packs';
import type { Card, ImageRef } from '@/lib/engine/types';

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

  it('rewrites and drops hold quota keys with the pack', () => {
    const held = createBoard(
      [{ ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: true, holdQuotas: { notes: 2 } }],
      [],
    );
    const renamed = renamePack({
      packIds: ['notes'],
      cards: [],
      board: held,
      from: 'notes',
      to: 'clues',
    });
    expect(renamed.board.floors[0]?.holdQuotas).toEqual({ clues: 2 });
    const deleted = deletePack({
      packIds: renamed.packIds,
      cards: [],
      board: renamed.board,
      packId: 'clues',
    });
    expect(deleted.board.floors[0]?.holdQuotas).toEqual({});
  });
});


describe('uniquePackName', () => {
  it('keeps an unused name and suffixes until unique', () => {
    expect(uniquePackName(['climb'], 'notes')).toBe('notes');
    expect(uniquePackName(['climb'], 'climb')).toBe('climb 2');
    expect(uniquePackName(['climb', 'climb 2'], 'climb')).toBe('climb 3');
    expect(uniquePackName(['notes'], '  notes  ')).toBe('notes 2');
    expect(uniquePackName([], '  ')).toBeNull();
  });
});

describe('copyPack and removePack', () => {
  const back: ImageRef = { id: 'back-1', name: 'back.png', source: 'url', src: 'https://example.com/back.png' };

  it('deep-copies a pack under a unique name with new card ids', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const sourceCard: Card = { id: 'climb-1', pack: 'climb', title: 'Rung', body: 'Up', image: back };
    const copied = copyPack({
      packIds: ['climb'],
      cards: [sourceCard],
      board,
      packBacks: { climb: back },
      source: { name: 'climb', cards: [sourceCard], backImage: back },
    });
    expect(copied.packIds).toEqual(['climb', 'climb 2']);
    expect(copied.cards).toHaveLength(2);
    const clone = copied.cards.find((card) => card.pack === 'climb 2');
    expect(clone?.title).toBe('Rung');
    expect(clone?.body).toBe('Up');
    expect(clone?.id).not.toBe('climb-1');
    expect(clone?.image).toEqual(back);
    expect(copied.packBacks['climb 2']).toEqual(back);
    expect(sourceCard.pack).toBe('climb');
  });

  it('removePack floats the pack and drops floor, room, and hold refs', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    const host = floor.cells.find((cell) => cell.kind === 'corridor')!;
    const board = createBoard(
      [
        {
          ...floor,
          holdEnabled: true,
          holdQuotas: { notes: 2 },
          cells: floor.cells.map((cell) => (cell.id === host.id ? { ...cell, packId: 'notes' } : cell)),
        },
      ],
      [],
      [
        {
          id: 'room-1',
          name: 'Room 1',
          mode: 'multi',
          cells: [{ id: 'room-1-c0', index: 0, kind: 'corridor', packId: 'notes' }],
        },
      ],
    );
    const removed = removePack({
      packIds: ['notes'],
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue', body: 'Knock' }],
      board,
      packBacks: { notes: back },
      packId: 'notes',
    });
    expect(removed.packIds).toEqual([]);
    expect(removed.cards).toEqual([]);
    expect(removed.packBacks).toEqual({});
    expect(removed.board.floors[0]?.cells.find((cell) => cell.id === host.id)?.packId).toBeUndefined();
    expect(removed.board.floors[0]?.holdQuotas).toEqual({});
    expect(removed.board.rooms?.[0]?.cells?.[0]?.packId).toBeUndefined();
    expect(removed.floating).toMatchObject({
      name: 'notes',
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue', body: 'Knock' }],
      backImage: back,
    });
    expect(removed.floating.id).toMatch(/^float-pack-/);
  });

  it('deletePack destroys this copy and does not return floating', () => {
    const board = setCellPack(
      createBoard([createLoopedFloor('ground', 'Level 1', 0)], []),
      'ground',
      'ground-c1',
      'notes',
    );
    const deleted = deletePack({
      packIds: ['notes'],
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue' }],
      board,
      packBacks: { notes: back },
      packId: 'notes',
    });
    expect(deleted.packIds).toEqual([]);
    expect(deleted.cards).toEqual([]);
    expect(deleted.packBacks).toEqual({});
    expect(deleted.board.floors[0]?.cells.find((cell) => cell.id === 'ground-c1')?.packId).toBeUndefined();
    expect('floating' in deleted).toBe(false);
  });
});

describe('copyCard and removeCard', () => {
  it('deep-copies a card into the selected pack with a new id', () => {
    const source: Card = { id: 'other-1', pack: 'other', title: 'Door', body: 'Knock', extraButton: 'Done' };
    const copied = copyCard([{ id: 'notes-1', pack: 'notes', title: 'Clue' }], 'notes', source);
    expect(copied).toHaveLength(2);
    const clone = copied.find((card) => card.id !== 'notes-1');
    expect(clone).toMatchObject({ pack: 'notes', title: 'Door', body: 'Knock', extraButton: 'Done' });
    expect(clone?.id).not.toBe('other-1');
    expect(source.pack).toBe('other');
  });

  it('removeCard leaves a floating clone and deleteCard destroys this copy', () => {
    const cards: Card[] = [
      { id: 'notes-1', pack: 'notes', title: 'Clue' },
      { id: 'notes-2', pack: 'notes', title: 'Door' },
    ];
    const removed = removeCard(cards, 'notes-1');
    expect(removed.cards).toEqual([{ id: 'notes-2', pack: 'notes', title: 'Door' }]);
    expect(removed.floating).toMatchObject({ title: 'Clue' });
    expect(removed.floating.id).not.toBe('notes-1');
    expect(deleteCard(cards, 'notes-1')).toEqual([{ id: 'notes-2', pack: 'notes', title: 'Door' }]);
  });
});

describe('pack backs', () => {
  const back: ImageRef = { id: 'back-1', name: 'back.png', source: 'url', src: 'https://example.com/back.png' };

  it('renames packBacks with the pack and prefers a card image override', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const renamed = renamePack({
      packIds: ['notes'],
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue' }],
      board,
      packBacks: { notes: back },
      from: 'notes',
      to: 'clues',
    });
    expect(renamed.packIds).toEqual(['clues']);
    expect(renamed.packBacks).toEqual({ clues: back });
    const override: ImageRef = { id: 'card-back', name: 'card.png', source: 'url', src: 'https://example.com/card.png' };
    expect(cardBackImage({ id: 'n1', pack: 'clues', title: 'Clue' }, back)).toEqual(back);
    expect(cardBackImage({ id: 'n1', pack: 'clues', title: 'Clue', image: override }, back)).toEqual(override);
    expect(setPackBack({ clues: back }, 'clues', undefined)).toEqual({});
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

  it('stores a timer and extra button and clears them when blank', () => {
    const added = addCard([], { id: 'notes-1', pack: 'notes', title: 'Clue' });
    const timed = updateCard(added, 'notes-1', { timerSeconds: 8, extraButton: ' Done ' });
    expect(timed[0]).toMatchObject({ timerSeconds: 8, extraButton: 'Done' });
    const cleared = updateCard(timed, 'notes-1', { timerSeconds: 0, extraButton: '  ' });
    expect(cleared[0]?.timerSeconds).toBeUndefined();
    expect(cleared[0]?.extraButton).toBeUndefined();
  });

  it('sets and clears card audio', () => {
    const added = addCard([], { id: 'notes-1', pack: 'notes', title: 'Clue' });
    const clip = { id: 'a2', name: 'deal.wav', source: 'file' as const, mime: 'audio/wav' };
    const withAudio = updateCard(added, 'notes-1', { audio: clip });
    expect(withAudio[0]?.audio).toEqual(clip);
    const cleared = updateCard(withAudio, 'notes-1', { audio: undefined });
    expect(cleared[0]?.audio).toBeUndefined();
  });

  it('sets and clears a card back image', () => {
    const added = addCard([], { id: 'notes-1', pack: 'notes', title: 'Clue' });
    const image: ImageRef = { id: 'img-1', name: 'card.png', source: 'url', src: 'https://example.com/card.png' };
    const withImage = updateCard(added, 'notes-1', { image });
    expect(withImage[0]?.image).toEqual(image);
    const cleared = updateCard(withImage, 'notes-1', { image: undefined });
    expect(cleared[0]?.image).toBeUndefined();
  });
});
