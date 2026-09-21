import { createBoard, type Board } from '@/lib/engine/board';
import {
  cellAt,
  createLoopedFloor,
  inBounds,
  isHudSlot,
  retileFloor,
} from '@/lib/engine/layout';
import type { Floor } from '@/lib/engine/types';

function mapFloor(board: Board, floorId: string, fn: (floor: Floor) => Floor): Board {
  return createBoard(
    board.floors.map((floor) => (floor.id === floorId ? retileFloor(fn(floor)) : floor)),
    board.stairs,
  );
}

export function nextCellId(floor: Floor): string {
  let i = 0;
  while (floor.cells.some((cell) => cell.id === `${floor.id}-c${i}`)) i += 1;
  return `${floor.id}-c${i}`;
}

export function nextFloorId(board: Board): string {
  let i = board.floors.length;
  while (board.floors.some((floor) => floor.id === `floor-${i}`)) i += 1;
  return `floor-${i}`;
}

export function placeCorridor(
  board: Board,
  floorId: string,
  col: number,
  row: number,
  cellId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || isHudSlot(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: [
      ...current.cells,
      {
        id: cellId,
        index: current.cells.length,
        kind: 'corridor' as const,
        col,
        row,
      },
    ],
  }));
}

export function moveCell(
  board: Board,
  floorId: string,
  cellId: string,
  col: number,
  row: number,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || isHudSlot(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => (cell.id === cellId ? { ...cell, col, row } : cell)),
  }));
}

export function eraseCell(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell) return board;
  const stairs = board.stairs.filter((s) => s.id !== cell.stairId);
  const next = createBoard(
    board.floors.map((current) => {
      if (current.id !== floorId) return current;
      const cells = current.cells.filter((c) => c.id !== cellId);
      const hasStart = cells.some((c) => c.start);
      const withStart =
        hasStart || cells.length === 0
          ? cells
          : cells.map((c, i) => (i === 0 ? { ...c, start: true } : { ...c, start: false }));
      return retileFloor({ ...current, cells: withStart });
    }),
    stairs,
  );
  return next;
}

export function setCellPack(
  board: Board,
  floorId: string,
  cellId: string,
  packId: string | undefined,
): Board {
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => {
      if (cell.id !== cellId) return cell;
      if (cell.kind === 'stair') return cell;
      return { ...cell, packId };
    }),
  }));
}

export function setStartCell(board: Board, floorId: string, cellId: string): Board {
  const exists = board.floors.some(
    (floor) => floor.id === floorId && floor.cells.some((cell) => cell.id === cellId),
  );
  if (!exists) return board;
  return createBoard(
    board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => ({
        ...cell,
        start: floor.id === floorId && cell.id === cellId,
      })),
    })),
    board.stairs,
  );
}

export function addFloor(board: Board, id: string, label: string): Board {
  if (board.floors.some((floor) => floor.id === id)) return board;
  const floor = createLoopedFloor(id, label, board.floors.length);
  return createBoard([...board.floors, floor], board.stairs);
}

export function renameFloor(board: Board, floorId: string, label: string): Board {
  const trimmed = label.trim();
  if (!trimmed) return board;
  return createBoard(
    board.floors.map((floor) => (floor.id === floorId ? { ...floor, label: trimmed } : floor)),
    board.stairs,
  );
}

export function deleteFloor(board: Board, floorId: string): Board {
  if (board.floors.length <= 1) return board;
  if (!board.floors.some((floor) => floor.id === floorId)) return board;
  const floors = board.floors
    .filter((floor) => floor.id !== floorId)
    .map((floor, index) => ({ ...floor, index }));
  const stairs = board.stairs.filter(
    (stair) => stair.fromFloorId !== floorId && stair.toFloorId !== floorId,
  );
  return createBoard(floors, stairs);
}

export function nextStairId(cellId: string): string {
  return `s-${cellId}`;
}

export function attachStair(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell || cell.kind === 'stair') return board;
  const stairId = nextStairId(cellId);
  const floors = board.floors.map((current) => {
    if (current.id !== floorId) return current;
    return retileFloor({
      ...current,
      cells: current.cells.map((c) =>
        c.id === cellId
          ? { ...c, kind: 'stair' as const, stairId, packId: undefined }
          : c,
      ),
    });
  });
  return createBoard(floors, [
    ...board.stairs,
    { id: stairId, fromFloorId: floorId, toFloorId: '', toCellId: '', legal: false },
  ]);
}

export function linkStair(
  board: Board,
  stairId: string,
  toFloorId: string,
  toCellId: string,
): Board {
  const dest = board.floors
    .find((floor) => floor.id === toFloorId)
    ?.cells.find((cell) => cell.id === toCellId);
  if (!dest) return board;
  return createBoard(
    board.floors,
    board.stairs.map((stair) =>
      stair.id === stairId
        ? { ...stair, toFloorId, toCellId, legal: true }
        : stair,
    ),
  );
}

export function clearStair(board: Board, floorId: string, cellId: string): Board {
  const cell = board.floors
    .find((floor) => floor.id === floorId)
    ?.cells.find((c) => c.id === cellId);
  if (!cell?.stairId) return board;
  const floors = board.floors.map((current) => {
    if (current.id !== floorId) return current;
    return retileFloor({
      ...current,
      cells: current.cells.map((c) =>
        c.id === cellId
          ? { ...c, kind: 'corridor' as const, stairId: undefined }
          : c,
      ),
    });
  });
  return createBoard(
    floors,
    board.stairs.filter((stair) => stair.id !== cell.stairId),
  );
}
