import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import {
  applyStartToPlayers,
  areAdjacent,
  cellAt,
  createLoopedFloor,
  defaultLoopPositions,
  ensureBoardLayout,
  isHudSlot,
  listPackIds,
  orderCellsAlongLoop,
  previewBoardForFloor,
  stairLabel,
  startToken,
} from '@/lib/engine/layout';
import { addPlayer, createPlayerState } from '@/lib/engine/players';

const square3Positions = buildShapeLayout({ kind: 'square', tilesPerSide: 3 }).slots.map((s) => ({
  col: s.col!,
  row: s.row!,
}));

describe('defaultLoopPositions', () => {
  it('builds a square ring with equal sides around the HUD', () => {
    expect(defaultLoopPositions(8)).toEqual(square3Positions);
  });
});

describe('createLoopedFloor', () => {
  it('uses the default square 8 shape, keeps cells off the HUD, and marks start on floor 0', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    expect(floor.shape).toEqual({ kind: 'square', tilesPerSide: 8 });
    expect(floor.columns).toBe(10);
    expect(floor.rows).toBe(10);
    expect(floor.cells).toHaveLength(28);
    expect(floor.cells[0]).toMatchObject({
      id: 'ground-c0',
      index: 0,
      kind: 'corridor',
      region: 'ring',
      start: true,
    });
    for (const cell of floor.cells) {
      expect(isHudSlot(floor, cell.col!, cell.row!)).toBe(false);
    }
    const later = createLoopedFloor('floor-1', 'Floor 1', 1);
    expect(later.cells.some((c) => c.start)).toBe(false);
  });
});

describe('ensureBoardLayout', () => {
  it('fills missing coords from index order and does not move existing col/row', () => {
    const board = createBoard(
      [
        {
          id: 'f0',
          index: 0,
          label: 'Lobby',
          cells: Array.from({ length: 8 }, (_, i) =>
            i === 5 ? { id: 'f', index: 5, col: 7, row: 5 } : { id: String.fromCharCode(97 + i), index: i },
          ),
        },
      ],
      [],
    );
    const ensured = ensureBoardLayout(board);
    expect(ensured.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 3 });
    expect(ensured.floors[0]?.cells[0]).toMatchObject({
      id: 'a',
      col: square3Positions[0]!.col,
      row: square3Positions[0]!.row,
      start: true,
    });
    expect(ensured.floors[0]?.cells[5]).toMatchObject({ col: 7, row: 5 });
    expect(board.floors[0]?.cells[0]?.col).toBeUndefined();
  });

  it('infers square 3 on an old 8-cell draft and does not move placed cells', () => {
    const ensured = ensureBoardLayout(
      createBoard(
        [{ id: 'f0', index: 0, label: 'L', cells: Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, index: i })) }],
        [],
      ),
    );
    expect(ensured.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 3 });
  });
});

describe('areAdjacent and cellAt', () => {
  it('uses 4-way adjacency only', () => {
    expect(areAdjacent({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(true);
    expect(areAdjacent({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(false);
    const floor = createLoopedFloor('ground', 'Ground', 0);
    expect(cellAt(floor, 1, 1)?.id).toBe('ground-c0');
    expect(cellAt(floor, 3, 0)).toBeUndefined();
  });
});

describe('orderCellsAlongLoop', () => {
  it('rewrites index around the start cell for the default square 8 loop', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const ordered = orderCellsAlongLoop(floor.cells);
    expect(ordered).toHaveLength(28);
    expect(ordered?.[0]?.id).toBe('ground-c0');
    expect(ordered?.every((c, i) => c.index === i)).toBe(true);
  });

  it('returns null when a cell sticks off the loop', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    floor.cells.push({
      id: 'ground-c9',
      index: 29,
      kind: 'corridor',
      col: 0,
      row: 0,
    });
    expect(orderCellsAlongLoop(floor.cells)).toBeNull();
  });
});

describe('startToken and applyStartToPlayers', () => {
  it('moves every player to the marked start square', () => {
    const board = createBoard(
      [
        {
          ...createLoopedFloor('ground', 'Ground', 0),
          cells: createLoopedFloor('ground', 'Ground', 0).cells.map((c) => ({
            ...c,
            start: c.id === 'ground-c2',
          })),
        },
      ],
      [],
    );
    expect(startToken(board)).toEqual({ floorId: 'ground', cellId: 'ground-c2' });
    const players = applyStartToPlayers(
      addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'P',
        token: { floorId: 'ground', cellId: 'ground-c0' },
      }),
      board,
    );
    expect(players.players[0]?.token).toEqual({ floorId: 'ground', cellId: 'ground-c2' });
  });
});

describe('stairLabel and previewBoardForFloor', () => {
  it('labels up using the destination floor name and flattens preview Y', () => {
    const lobby = createLoopedFloor('lobby', 'Lobby', 0);
    const f1 = createLoopedFloor('f1', 'Floor 1', 1);
    const board = createBoard(
      [lobby, f1],
      [{ id: 's1', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1-c0', legal: true }],
    );
    expect(stairLabel(board, board.stairs[0]!)).toBe('Up to Floor 1');
    const preview = previewBoardForFloor(board, 'f1');
    expect(preview.floors).toHaveLength(1);
    expect(preview.floors[0]?.index).toBe(0);
    expect(preview.floors[0]?.id).toBe('f1');
  });
});

describe('listPackIds', () => {
  it('returns sorted unique pack ids', () => {
    expect(listPackIds([{ pack: 'climb' }, { pack: 'notes' }, { pack: 'climb' }])).toEqual([
      'climb',
      'notes',
    ]);
  });
});
