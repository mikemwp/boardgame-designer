import { createBoard, type Board } from '@/lib/engine/board';
import {
  cellAt,
  createLoopedFloor,
  inBounds,
  isHudSlot,
  retileFloor,
} from '@/lib/engine/layout';
import { normalizeShape } from '@/lib/engine/shape';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import type { BoardShape, Cell, Floor } from '@/lib/engine/types';

function isPolarKind(kind: BoardShape['kind'] | undefined): boolean {
  return kind === 'circle' || kind === 'hub-spoke' || kind === 'hub-spoke-wheel';
}

function designerProps(prev: Cell): Pick<Cell, 'kind' | 'packId' | 'stairId' | 'start' | 'end'> {
  return {
    kind: prev.kind,
    packId: prev.kind === 'stair' ? undefined : prev.packId,
    stairId: prev.stairId,
    start: prev.start,
    end: prev.end,
  };
}

function mapFloor(board: Board, floorId: string, fn: (floor: Floor) => Floor): Board {
  return createBoard(
    board.floors.map((floor) => (floor.id === floorId ? retileFloor(fn(floor)) : floor)),
    board.stairs,
  );
}

function cellOccupiesSlot(
  cell: { region?: string; spokeIndex?: number; slot?: number },
  slot: { region: string; spokeIndex?: number; slot: number },
): boolean {
  return (
    cell.region === slot.region &&
    (cell.spokeIndex ?? -1) === (slot.spokeIndex ?? -1) &&
    cell.slot === slot.slot
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

export function applyFloorShape(board: Board, floorId: string, shapeInput: BoardShape): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor) return board;
  const template = createLoopedFloor(floor.id, floor.label, floor.index, shapeInput);
  const newPolar = isPolarKind(template.shape?.kind);
  const oldPolar = isPolarKind(floor.shape?.kind);

  let mapped: Cell[];
  if (newPolar || oldPolar) {
    const prevNonHud = floor.cells.filter((cell) => cell.kind !== 'hud');
    let prevIndex = 0;
    mapped = template.cells.map((cell) => {
      if (cell.kind === 'hud') return cell;
      const prev = prevNonHud[prevIndex];
      prevIndex += 1;
      if (!prev) return cell;
      return { ...cell, id: prev.id, ...designerProps(prev) };
    });
  } else {
    const oldByPos = new Map<string, Cell>();
    for (const cell of floor.cells) {
      if (cell.col === undefined || cell.row === undefined) continue;
      oldByPos.set(`${cell.col},${cell.row}`, cell);
    }
    const ring = template.cells
      .filter((cell) => cell.kind !== 'hud')
      .map((cell) => {
        const prev = oldByPos.get(`${cell.col},${cell.row}`);
        if (!prev || prev.kind === 'hud') return cell;
        return { ...cell, id: prev.id, ...designerProps(prev) };
      });
    const used = new Set(ring.map((cell) => `${cell.col},${cell.row}`));
    const oldCols = floor.columns ?? 0;
    const oldRows = floor.rows ?? 0;
    const extras = floor.cells.filter((cell) => {
      if (cell.kind === 'hud') return false;
      if (cell.col === undefined || cell.row === undefined) return false;
      if (!inBounds(template, cell.col, cell.row)) return false;
      if (isHudSlot(template, cell.col, cell.row)) return false;
      if (used.has(`${cell.col},${cell.row}`)) return false;
      const wasPerimeter =
        cell.col === 0 ||
        cell.row === 0 ||
        (oldCols > 0 && cell.col === oldCols - 1) ||
        (oldRows > 0 && cell.row === oldRows - 1);
      return !wasPerimeter;
    });
    const hud = template.cells.filter((cell) => cell.kind === 'hud');
    mapped = [...ring, ...extras, ...hud];
  }

  const keepStairIds = new Set(mapped.map((c) => c.stairId).filter(Boolean) as string[]);
  const stairs = board.stairs.filter(
    (s) => s.fromFloorId !== floorId || keepStairIds.has(s.id),
  );
  return createBoard(
    board.floors.map((f) =>
      f.id === floorId
        ? { ...template, cells: mapped, holdEnabled: floor.holdEnabled, holdQuotas: floor.holdQuotas }
        : f,
    ),
    stairs,
  );
}

export function placeHud(
  board: Board,
  floorId: string,
  col: number,
  row: number,
  cellId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || !isHudSlot(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: [
      ...current.cells,
      {
        id: cellId,
        index: current.cells.length,
        kind: 'hud' as const,
        col,
        row,
      },
    ],
  }));
}

export function placeCorridor(
  board: Board,
  floorId: string,
  col: number,
  row: number,
  cellId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || cellAt(floor, col, row)) {
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

export function placeCorridorOnSlot(
  board: Board,
  floorId: string,
  slotId: string,
  cellId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor?.shape) return board;
  const layout = buildShapeLayout(floor.shape);
  const slot = layout.slots.find((s) => s.id === slotId);
  if (!slot) return board;
  if (floor.cells.some((c) => cellOccupiesSlot(c, slot))) return board;
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: [
      ...current.cells,
      {
        id: cellId,
        index: current.cells.length,
        kind: 'corridor' as const,
        region: slot.region,
        spokeIndex: slot.spokeIndex,
        slot: slot.slot,
        col: slot.col,
        row: slot.row,
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
  if (!floor || !inBounds(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => (cell.id === cellId ? { ...cell, col, row } : cell)),
  }));
}

export function moveCellToSlot(
  board: Board,
  floorId: string,
  cellId: string,
  slotId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor?.shape) return board;
  const layout = buildShapeLayout(floor.shape);
  const slot = layout.slots.find((s) => s.id === slotId);
  if (!slot) return board;
  if (floor.cells.some((c) => c.id !== cellId && cellOccupiesSlot(c, slot))) return board;
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) =>
      cell.id === cellId
        ? {
            ...cell,
            region: slot.region,
            spokeIndex: slot.spokeIndex,
            slot: slot.slot,
            col: slot.col,
            row: slot.row,
          }
        : cell,
    ),
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
      return retileFloor({ ...current, cells });
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
        end: floor.id === floorId && cell.id === cellId ? false : cell.end,
      })),
    })),
    board.stairs,
  );
}

export function setEndCell(board: Board, floorId: string, cellId: string): Board {
  const exists = board.floors.some(
    (floor) => floor.id === floorId && floor.cells.some((cell) => cell.id === cellId),
  );
  if (!exists) return board;
  return createBoard(
    board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => ({
        ...cell,
        end: floor.id === floorId && cell.id === cellId,
        start: floor.id === floorId && cell.id === cellId ? false : cell.start,
      })),
    })),
    board.stairs,
  );
}

export function addFloor(board: Board, id: string, label: string, shape?: BoardShape): Board {
  if (board.floors.some((floor) => floor.id === id)) return board;
  const shapeInput = normalizeShape(shape ?? board.floors.at(-1)?.shape);
  const floor = createLoopedFloor(id, label, board.floors.length, shapeInput);
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
