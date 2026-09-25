import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import {
  addFloor,
  attachRoom,
  attachStair,
  eraseCell,
  placeCorridor,
  setEndCell,
  setFloorFinal,
  setRoomMode,
  setStartCell,
  setStairLandingAt,
} from '@/lib/designer/mutate';
import { canPublishPlay, canTestPlay, validateLayout } from '@/lib/designer/validate';

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
      1,
      1,
      'ground-c99',
    );
    expect(validateLayout(broken).some((i) => i.code === 'non-loop')).toBe(true);
  });

  it('blocks an empty floor, a missing start, and a missing HUD tile', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    for (const id of [...board.floors[0]!.cells.map((c) => c.id)]) {
      board = eraseCell(board, 'ground', id);
    }
    const issues = validateLayout(board);
    expect(issues.some((i) => i.code === 'empty-floor')).toBe(true);
    expect(issues.some((i) => i.code === 'missing-start')).toBe(true);
    expect(issues.some((i) => i.code === 'missing-hud')).toBe(true);
    expect(issues.find((i) => i.code === 'missing-start')?.message).toBe('Mark a start tile.');
    expect(issues.find((i) => i.code === 'missing-hud')?.message).toBe('Place at least one HUD tile.');
  });

  it('allows a room on the loop and blocks a multi room with no interior', () => {
    let board = attachRoom(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 'ground-c3');
    board = setStartCell(board, 'ground', 'ground-c0');
    expect(validateLayout(board).some((i) => i.code === 'non-loop')).toBe(false);

    const roomId = board.rooms![0]!.id;
    board = setRoomMode(board, roomId, 'multi');
    expect(validateLayout(board).some((i) => i.code === 'room-without-interior')).toBe(false);
    const emptyInterior = {
      ...board,
      rooms: board.rooms!.map((room) => ({ ...room, cells: [] })),
    };
    expect(validateLayout(emptyInterior).some((i) => i.code === 'room-without-interior')).toBe(true);
    expect(validateLayout(emptyInterior).find((i) => i.code === 'room-without-interior')?.message).toBe(
      'Room 1: multi-tile room has no walkable interior.',
    );
  });

  it('blocks a multi-tile room that has no Door', () => {
    let board = attachRoom(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 'ground-c3');
    board = setStartCell(board, 'ground', 'ground-c0');
    board = setRoomMode(board, board.rooms![0]!.id, 'multi');
    expect(validateLayout(board).some((i) => i.code === 'missing-room-door')).toBe(true);
    expect(canTestPlay(board)).toBe(false);
  });

  it('does not require an end tile for test play', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    board = setStartCell(board, 'ground', 'ground-c0');
    expect(validateLayout(board)).toEqual([]);
    expect(canTestPlay(board)).toBe(true);
    board = setEndCell(board, 'ground', 'ground-c1');
    expect(validateLayout(board)).toEqual([]);
    expect(canTestPlay(board)).toBe(true);
  });

  it('skips the closed loop on a Final level but still blocks dangling stairs', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    board = setStartCell(board, 'ground', 'ground-c0');
    board = placeCorridor(board, 'ground', 1, 1, 'ground-c99');
    expect(validateLayout(board).some((i) => i.code === 'non-loop')).toBe(true);
    expect(canTestPlay(board)).toBe(false);

    const flagged = setFloorFinal(board, 'ground', true);
    expect(validateLayout(flagged).some((i) => i.code === 'non-loop' || i.code === 'broken-spoke')).toBe(
      false,
    );
    expect(canTestPlay(flagged)).toBe(true);

    const dangling = attachStair(flagged, 'ground', 'ground-c3');
    expect(validateLayout(dangling).some((i) => i.code === 'dangling-stair')).toBe(true);
    expect(canTestPlay(dangling)).toBe(false);
  });

  it('allows Test on a new board with Start and no stairs', () => {
    const board = setStartCell(emptyBootstrap().board, 'ground', 'ground-c0');
    expect(board.stairs).toHaveLength(0);
    expect(validateLayout(board).some((issue) => issue.code === 'dangling-stair')).toBe(false);
    expect(validateLayout(board)).toEqual([]);
    expect(canTestPlay(board)).toBe(true);
  });

  it('allows Test when a stair is linked and blocks with a message when it is not', () => {
    let board = setStartCell(emptyBootstrap().board, 'ground', 'ground-c0');
    board = addFloor(board, 'floor-1', 'Level 2');
    board = attachStair(board, 'ground', 'ground-c3');
    const unlinked = validateLayout(board);
    expect(unlinked.some((issue) => issue.code === 'dangling-stair')).toBe(true);
    expect(unlinked.find((issue) => issue.code === 'dangling-stair')?.message).toBe(
      'Level 1: stair has no destination.',
    );
    expect(canTestPlay(board)).toBe(false);

    const dest = board.floors[1]!.cells.find((cell) => cell.col === 0 && cell.row === 0)!;
    board = setStairLandingAt(board, board.stairs[0]!.id, 'floor-1', dest.col!, dest.row!);
    expect(board.stairs[0]).toMatchObject({
      toFloorId: 'floor-1',
      toCellId: dest.id,
      legal: true,
    });
    expect(validateLayout(board).some((issue) => issue.code === 'dangling-stair')).toBe(false);
    expect(canTestPlay(board)).toBe(true);
  });

  it('canPublishPlay matches canTestPlay', () => {
    expect(canPublishPlay(climbSample.board)).toBe(canTestPlay(climbSample.board));
    expect(canPublishPlay(emptyBootstrap().board)).toBe(false);
  });
});
