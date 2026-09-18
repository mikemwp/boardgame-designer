import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { sampleStairLanding } from '@/lib/engine/movement';

const board = createBoard(
  [
    { id: 'f0', index: 0, label: 'L', cells: [{ id: 'c0', index: 0 }] },
    { id: 'f1', index: 1, label: '1', cells: [{ id: 'c1', index: 0 }] },
    { id: 'f2', index: 2, label: '2', cells: [{ id: 'c2', index: 0 }] },
  ],
  [
    { id: 's-ok', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: true },
    { id: 's-bad', fromFloorId: 'f0', toFloorId: 'f2', toCellId: 'c2', legal: false },
  ],
);

describe('sampleStairLanding', () => {
  it('never returns illegal stair landings', () => {
    for (let i = 0; i < 20; i++) {
      const landing = sampleStairLanding(board, 'f0', () => Math.random());
      expect(landing?.stairId).toBe('s-ok');
    }
  });
});
