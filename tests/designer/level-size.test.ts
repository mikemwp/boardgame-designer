import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { applyFloorShape, attachStair, setStartCell } from '@/lib/designer/mutate';
import { isVanillaFloor, resetFloor } from '@/lib/designer/level-size';

describe('isVanillaFloor', () => {
  it('is true for a fresh looped floor and false after start or stair', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    expect(isVanillaFloor(floor)).toBe(true);
    const board = createBoard([floor], []);
    const started = setStartCell(board, 'ground', floor.cells.find((c) => c.kind === 'corridor')!.id);
    expect(isVanillaFloor(started.floors[0]!)).toBe(false);
    const stair = attachStair(board, 'ground', floor.cells.find((c) => c.kind === 'corridor')!.id);
    expect(isVanillaFloor(stair.floors[0]!)).toBe(false);
  });
});

describe('resetFloor', () => {
  it('wipes start and stairs and keeps shape, size, and name', () => {
    let board = createBoard([createLoopedFloor('ground', 'Lobby', 0, { kind: 'square', tilesPerSide: 12 })], []);
    const cell = board.floors[0]!.cells.find((c) => c.kind === 'corridor')!;
    board = setStartCell(board, 'ground', cell.id);
    board = attachStair(board, 'ground', board.floors[0]!.cells.find((c) => c.kind === 'corridor' && !c.start)!.id);
    const next = resetFloor(board, 'ground');
    expect(next.floors[0]?.label).toBe('Lobby');
    expect(next.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 12 });
    expect(isVanillaFloor(next.floors[0]!)).toBe(true);
    expect(next.floors[0]!.cells.some((c) => c.start || c.kind === 'stair')).toBe(false);
    expect(next.stairs).toEqual([]);
  });
});

describe('applyFloorShape', () => {
  it('refuses to reshape a configured floor', () => {
    let board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    board = setStartCell(board, 'ground', board.floors[0]!.cells.find((c) => c.kind === 'corridor')!.id);
    const same = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(same).toBe(board);
  });

  it('still reshapes a vanilla floor', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const next = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(next.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 10 });
    expect(isVanillaFloor(next.floors[0]!)).toBe(true);
  });

  it('keeps a vanilla floor unlocked after square↔rectangle reshapes with no paint', () => {
    let board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    board = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 11 });
    board = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 12 });
    board = applyFloorShape(board, 'ground', { kind: 'rectangle', length: 8, width: 6 });
    expect(isVanillaFloor(board.floors[0]!)).toBe(true);
    expect(applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 8 })).not.toBe(board);
  });

  it('rebuilds 8×6 with a free ring all around and HUD never on the perimeter', () => {
    const board = applyFloorShape(
      createBoard([createLoopedFloor('ground', 'Level 1', 0, { kind: 'square', tilesPerSide: 12 })], []),
      'ground',
      { kind: 'rectangle', length: 8, width: 6 },
    );
    const floor = board.floors[0]!;
    expect(floor.columns).toBe(8);
    expect(floor.rows).toBe(6);
    const hud = floor.cells.filter((c) => c.kind === 'hud');
    expect(hud.length).toBeGreaterThan(0);
    for (const cell of hud) {
      expect(cell.col === 0 || cell.row === 0 || cell.col === 7 || cell.row === 5).toBe(false);
    }
    const occupied = new Set(floor.cells.map((c) => `${c.col},${c.row}`));
    expect(occupied.has('1,1')).toBe(false);
    expect(occupied.has('6,1')).toBe(false);
    expect(occupied.has('1,4')).toBe(false);
    expect(occupied.has('6,4')).toBe(false);
  });
});
