import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import { addFloor, attachStair, eraseCell, placeCorridor, setEndCell, setStartCell } from '@/lib/designer/mutate';
import { canTestPlay, validateLayout } from '@/lib/designer/validate';

describe('validateLayout', () => {
  it('allows Climb but blocks an empty board without a start tile', () => {
    expect(validateLayout(climbSample.board)).toEqual([]);
    expect(canTestPlay(emptyBootstrap().board)).toBe(false);
    expect(validateLayout(emptyBootstrap().board).some((i) => i.code === 'missing-start')).toBe(true);
  });

  it('allows a default hub/spoke floor whose spoke ends do not loop once a start tile is set', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, {
      kind: 'hub-spoke',
      hubTiles: 12,
      spokeCount: 4,
      spokeTiles: 6,
    });
    let board = createBoard([floor], []);
    board = setStartCell(board, 'ground', floor.cells[0]!.id);
    expect(validateLayout(board).filter((i) => i.code === 'non-loop')).toEqual([]);
    expect(canTestPlay(board)).toBe(true);
  });

  it('blocks a circle that is missing a wedge', () => {
    let board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 8 })],
      [],
    );
    board = eraseCell(board, 'ground', board.floors[0]!.cells[0]!.id);
    expect(validateLayout(board).some((i) => i.code === 'non-loop')).toBe(true);
  });

  it('blocks a broken spoke path and a non-looping hub', () => {
    let board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'hub-spoke' })],
      [],
    );
    const spokeMid = board.floors[0]!.cells.find((c) => c.region === 'spoke' && c.slot === 2)!;
    board = eraseCell(board, 'ground', spokeMid.id);
    expect(validateLayout(board).some((i) => i.code === 'broken-spoke')).toBe(true);
  });

  it('blocks a dangling stair and a broken loop, but the board is still a value', () => {
    const two = addFloor(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'floor-1', 'Floor 1');
    const dangling = attachStair(two, 'ground', 'ground-c3');
    const issues = validateLayout(dangling);
    expect(issues.some((i) => i.code === 'dangling-stair')).toBe(true);
    expect(canTestPlay(dangling)).toBe(false);
    expect(issues.find((i) => i.code === 'dangling-stair')?.message).toBe(
      'Ground: stair has no destination.',
    );

    const broken = placeCorridor(
      createBoard([createLoopedFloor('ground', 'Ground', 0)], []),
      'ground',
      0,
      0,
      'ground-c99',
    );
    expect(validateLayout(broken).some((i) => i.code === 'non-loop')).toBe(true);
  });

  it('blocks an empty floor and a missing start', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    for (const id of [...board.floors[0]!.cells.map((c) => c.id)]) {
      board = eraseCell(board, 'ground', id);
    }
    const issues = validateLayout(board);
    expect(issues.some((i) => i.code === 'empty-floor')).toBe(true);
    expect(issues.some((i) => i.code === 'missing-start')).toBe(true);
    expect(issues.find((i) => i.code === 'missing-start')?.message).toBe('Mark a start tile.');
  });

  it('does not require an end tile for test play', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    board = setStartCell(board, 'ground', 'ground-c0');
    board = setEndCell(board, 'ground', 'ground-c1');
    expect(validateLayout(board)).toEqual([]);
  });
});
