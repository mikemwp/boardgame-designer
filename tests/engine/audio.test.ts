import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { cuesForLanding, cueForCard, isGameStartEmpty, emptyGameStart } from '@/lib/engine/audio';
import type { AudioRef, Cell, Floor } from '@/lib/engine/types';

const clip = (id: string): AudioRef => ({ id, name: `${id}.mp3`, source: 'url', src: `https://ex/${id}.mp3` });

function floor(cells: Cell[]): Floor {
  return { id: 'f1', index: 0, label: 'Level 1', cells };
}

describe('game start emptiness', () => {
  it('skips overlay when game start is empty', () => {
    expect(isGameStartEmpty(undefined)).toBe(true);
    expect(isGameStartEmpty(emptyGameStart())).toBe(true);
    expect(isGameStartEmpty({ audio: clip('g'), splashes: [], menu: { items: [] } })).toBe(false);
  });
});

describe('cuesForLanding', () => {
  it('plays tile audio on land', () => {
    const board = createBoard(
      [floor([{ id: 'c0', index: 0, kind: 'corridor', audio: clip('tile') }])],
      [],
    );
    expect(cuesForLanding(board, 'f1', 'c0').map((c) => c.target)).toEqual(['tile']);
  });

  it('plays stair audio on stair land', () => {
    const board = createBoard(
      [floor([{ id: 'c0', index: 0, kind: 'stair', stairId: 's1', audio: clip('up') }])],
      [{ id: 's1', fromFloorId: 'f1', toFloorId: 'f1', toCellId: 'c0', legal: true }],
    );
    const cues = cuesForLanding(board, 'f1', 'c0');
    expect(cues).toEqual([{ target: 'stair', ownerId: 'c0', audio: clip('up') }]);
  });

  it('plays room audio on the room host', () => {
    const board = createBoard(
      [
        floor([
          { id: 'r0', index: 0, kind: 'room', roomId: 'room-1', col: 0, row: 0, audio: clip('room') },
        ]),
      ],
      [],
    );
    expect(cuesForLanding(board, 'f1', 'r0')).toEqual([{ target: 'room', ownerId: 'r0', audio: clip('room') }]);
  });

  it('skips audio when walking past has no landing on that cell', () => {
    const board = createBoard(
      [
        floor([
          { id: 'c0', index: 0, kind: 'corridor', audio: clip('a') },
          { id: 'c1', index: 1, kind: 'corridor' },
        ]),
      ],
      [],
    );
    expect(cuesForLanding(board, 'f1', 'c1')).toEqual([]);
  });

  it('does not play room audio when landing a packed corridor', () => {
    const board = createBoard(
      [
        floor([
          { id: 'c0', index: 0, kind: 'corridor', col: 0, row: 0, packId: 'notes', audio: clip('tile') },
          { id: 'r0', index: 1, kind: 'room', col: 0, row: 1, audio: clip('room') },
        ]),
      ],
      [],
    );
    expect(cuesForLanding(board, 'f1', 'c0').map((c) => c.target)).toEqual(['tile']);
  });

  it('returns no cues for HUD or missing cells', () => {
    const board = createBoard(
      [floor([{ id: 'h0', index: 0, kind: 'hud', col: 1, row: 1, audio: clip('hud') }])],
      [],
    );
    expect(cuesForLanding(board, 'f1', 'h0')).toEqual([]);
    expect(cuesForLanding(board, 'f1', 'missing')).toEqual([]);
  });
});

describe('cueForCard', () => {
  it('deals card cue when the card has audio', () => {
    expect(cueForCard({ id: 'card-1', pack: 'notes', title: 'A', audio: clip('deal') })).toEqual([
      { target: 'card', ownerId: 'card-1', audio: clip('deal') },
    ]);
    expect(cueForCard({ id: 'card-1', pack: 'notes', title: 'A' })).toEqual([]);
  });
});
