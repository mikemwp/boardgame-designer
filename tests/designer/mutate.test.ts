import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, isHudSlot } from '@/lib/engine/layout';
import {
  addFloor,
  attachStair,
  clearStair,
  deleteFloor,
  eraseCell,
  linkStair,
  moveCell,
  placeCorridor,
  renameFloor,
  setCellPack,
  setStartCell,
} from '@/lib/designer/mutate';

function groundBoard() {
  return createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
}

describe('placeCorridor', () => {
  it('rejects HUD and occupied slots, then appends an empty square', () => {
    const board = groundBoard();
    const floor = board.floors[0]!;
    const hudCol = floor.hud!.col;
    const hudRow = floor.hud!.row;
    expect(isHudSlot(floor, hudCol, hudRow)).toBe(true);
    expect(placeCorridor(board, 'ground', hudCol, hudRow, 'ground-c9')).toEqual(board);
    expect(placeCorridor(board, 'ground', 3, 4, 'ground-c9')).toEqual(board);
    const next = placeCorridor(board, 'ground', 0, 3, 'ground-c9');
    expect(next.floors[0]?.cells.some((c) => c.id === 'ground-c9')).toBe(true);
    expect(next.floors[0]?.cells.find((c) => c.id === 'ground-c9')).toMatchObject({
      kind: 'corridor',
      col: 0,
      row: 3,
    });
  });
});

describe('moveCell and eraseCell', () => {
  it('moves a cell onto an empty slot and erase drops it', () => {
    const moved = moveCell(groundBoard(), 'ground', 'ground-c7', 1, 1);
    expect(moved.floors[0]?.cells.find((c) => c.id === 'ground-c7')).toMatchObject({
      col: 1,
      row: 1,
    });
    const erased = eraseCell(moved, 'ground', 'ground-c7');
    expect(erased.floors[0]?.cells.some((c) => c.id === 'ground-c7')).toBe(false);
  });
});

describe('setCellPack and setStartCell', () => {
  it('assigns a pack on corridor only and keeps a single start', () => {
    const packed = setCellPack(groundBoard(), 'ground', 'ground-c1', 'notes');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBe('notes');
    const started = setStartCell(packed, 'ground', 'ground-c1');
    const starts = started.floors[0]!.cells.filter((c) => c.start);
    expect(starts.map((c) => c.id)).toEqual(['ground-c1']);
  });
});

describe('floors', () => {
  it('adds, renames, and refuses to delete the last floor', () => {
    const added = addFloor(groundBoard(), 'floor-1', 'Cellar');
    expect(added.floors.map((f) => f.id)).toEqual(['ground', 'floor-1']);
    expect(added.floors[1]?.index).toBe(1);
    expect(added.floors[1]?.cells).toHaveLength(8);
    const renamed = renameFloor(added, 'floor-1', 'Basement');
    expect(renamed.floors[1]?.label).toBe('Basement');
    const deleted = deleteFloor(renamed, 'floor-1');
    expect(deleted.floors).toHaveLength(1);
    expect(deleteFloor(deleted, 'ground').floors).toHaveLength(1);
  });
});

describe('stairs', () => {
  it('attaches a dangling stair, links it, and can convert back to corridor', () => {
    const two = addFloor(groundBoard(), 'floor-1', 'Floor 1');
    const attached = attachStair(two, 'ground', 'ground-c3');
    const cell = attached.floors[0]?.cells.find((c) => c.id === 'ground-c3');
    expect(cell?.kind).toBe('stair');
    expect(cell?.packId).toBeUndefined();
    const stair = attached.stairs.find((s) => s.id === cell?.stairId);
    expect(stair).toMatchObject({
      fromFloorId: 'ground',
      toFloorId: '',
      toCellId: '',
      legal: false,
    });
    const linked = linkStair(attached, stair!.id, 'floor-1', 'floor-1-c0');
    expect(linked.stairs[0]).toMatchObject({
      toFloorId: 'floor-1',
      toCellId: 'floor-1-c0',
      legal: true,
    });
    const cleared = clearStair(linked, 'ground', 'ground-c3');
    expect(cleared.stairs).toHaveLength(0);
    expect(cleared.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.kind).toBe('corridor');
  });

  it('does not put a pack on a stair', () => {
    const attached = attachStair(groundBoard(), 'ground', 'ground-c3');
    const packed = setCellPack(attached, 'ground', 'ground-c3', 'climb');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.packId).toBeUndefined();
  });
});
