import { describe, it, expect } from 'vitest';
import { createBoard, landingCellIdsOnFloor, listIllegalStairLandings } from '@/lib/engine/board';

const floors = [
  { id: 'f0', index: 0, label: 'Lobby', cells: [{ id: 'c0', index: 0 }] },
  { id: 'f1', index: 1, label: 'Floor 1', cells: [{ id: 'c1', index: 0 }] },
];
const stairs = [
  { id: 's1', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: false },
];

describe('createBoard', () => {
  it('accepts arbitrary floor count without cap', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      id: `f${i}`, index: i, label: `F${i}`, cells: [{ id: `c${i}`, index: 0 }],
    }));
    const board = createBoard(many, []);
    expect(board.floors).toHaveLength(50);
  });

  it('lists illegal stair landings for sampling exclusion', () => {
    const board = createBoard(floors, stairs);
    expect(listIllegalStairLandings(board, 'f0')).toEqual([
      { stairId: 's1', toFloorId: 'f1', toCellId: 'c1' },
    ]);
  });

  it('lists only the chosen legal landing on the destination floor', () => {
    const board = createBoard(floors, [
      { id: 's1', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: true },
      { id: 's2', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'missing', legal: false },
    ]);
    expect(landingCellIdsOnFloor(board, 'f1')).toEqual(['c1']);
    expect(landingCellIdsOnFloor(board, 'f0')).toEqual([]);
    expect(landingCellIdsOnFloor(createBoard(floors, []), 'f1')).toEqual([]);
  });
});
