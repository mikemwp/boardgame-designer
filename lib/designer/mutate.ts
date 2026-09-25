import { createBoard, type Board } from '@/lib/engine/board';
import {
  cellAt,
  createLoopedFloor,
  inBounds,
  retileFloor,
} from '@/lib/engine/layout';
import { normalizeShape } from '@/lib/engine/shape';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import type { AudioRef, BoardShape, Cell, Floor, HudWidget, ImageRef, VideoRef } from '@/lib/engine/types';
import { isVanillaFloor } from '@/lib/designer/level-size';
import { dropRoomsOnFloor } from '@/lib/designer/rooms';

export { isVanillaFloor, resetFloor } from '@/lib/designer/level-size';
export {
  applyRoomShape,
  attachRoom,
  deleteRoom,
  renameRoom,
  resetRoom,
  setRoomMode,
} from '@/lib/designer/rooms';

export { uniquifyCellIds } from '@/lib/engine/cell-ids';

function nextBoard(board: Board, floors: Floor[], stairs = board.stairs): Board {
  return createBoard(floors, stairs, board.rooms);
}

function mapFloor(board: Board, floorId: string, fn: (floor: Floor) => Floor): Board {
  return nextBoard(
    board,
    board.floors.map((floor) => (floor.id === floorId ? retileFloor(fn(floor)) : floor)),
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

export function nextLevelLabel(floors: Floor[]): string {
  let n = floors.length + 1;
  while (floors.some((floor) => floor.label === `Level ${n}`)) n += 1;
  return `Level ${n}`;
}

export function nextFloorId(board: Board): string {
  let i = board.floors.length;
  while (board.floors.some((floor) => floor.id === `floor-${i}`)) i += 1;
  return `floor-${i}`;
}

export function applyFloorShape(board: Board, floorId: string, shapeInput: BoardShape): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor) return board;
  if (!isVanillaFloor(floor)) return board;
  const template = createLoopedFloor(floor.id, floor.label, floor.index, shapeInput);
  return nextBoard(
    board,
    board.floors.map((f) => (f.id === floorId ? template : f)),
    board.stairs.filter((stair) => stair.fromFloorId !== floorId),
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
        kind: 'hud' as const,
        col,
        row,
      },
    ],
  }));
}

export function placeRoom(
  board: Board,
  _floorId: string,
  _col: number,
  _row: number,
  _cellId: string,
): Board {
  return board;
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
  const nextRooms = cell.roomId ? (board.rooms ?? []).filter((room) => room.id !== cell.roomId) : board.rooms;
  return createBoard(
    board.floors.map((current) => {
      if (current.id !== floorId) return current;
      const cells = current.cells.filter((c) => c.id !== cellId);
      return retileFloor({ ...current, cells });
    }),
    stairs,
    nextRooms && nextRooms.length > 0 ? nextRooms : undefined,
  );
}

function setCellMedia<K extends 'audio' | 'image' | 'video'>(
  board: Board,
  floorId: string,
  cellId: string,
  key: K,
  value: Cell[K],
): Board {
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => {
      if (cell.id !== cellId) return cell;
      if (cell.kind === 'hud') return cell;
      if (!value) {
        const next = { ...cell };
        delete next[key];
        return next;
      }
      return { ...cell, [key]: value };
    }),
  }));
}

export function setCellAudio(
  board: Board,
  floorId: string,
  cellId: string,
  audio: AudioRef | undefined,
): Board {
  return setCellMedia(board, floorId, cellId, 'audio', audio);
}

export function setCellImage(
  board: Board,
  floorId: string,
  cellId: string,
  image: ImageRef | undefined,
): Board {
  return setCellMedia(board, floorId, cellId, 'image', image);
}

export function setCellVideo(
  board: Board,
  floorId: string,
  cellId: string,
  video: VideoRef | undefined,
): Board {
  return setCellMedia(board, floorId, cellId, 'video', video);
}

export function setCellSpinner(
  board: Board,
  floorId: string,
  cellId: string,
  spinnerId: string | undefined,
): Board {
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => {
      if (cell.id !== cellId) return cell;
      if (cell.kind === 'hud') return cell;
      if (!spinnerId) {
        const { spinnerId: _drop, ...rest } = cell;
        return rest;
      }
      return { ...cell, spinnerId };
    }),
  }));
}

export function clearCell(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell || cell.kind === 'hud') return board;
  const stairs = cell.stairId ? board.stairs.filter((stair) => stair.id !== cell.stairId) : board.stairs;
  const nextRooms = cell.roomId ? (board.rooms ?? []).filter((room) => room.id !== cell.roomId) : board.rooms;
  return createBoard(
    board.floors.map((current) => {
      if (current.id !== floorId) return current;
      return retileFloor({
        ...current,
        cells: current.cells.map((entry) => {
          if (entry.id !== cellId) return entry;
          const {
            packId: _pack,
            spinnerId: _spinner,
            stairId: _stair,
            roomId: _room,
            start: _start,
            end: _end,
            audio: _audio,
            image: _image,
            video: _video,
            face: _face,
            ...rest
          } = entry;
          return { ...rest, kind: 'corridor' as const };
        }),
      });
    }),
    stairs,
    nextRooms && nextRooms.length > 0 ? nextRooms : undefined,
  );
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
  return nextBoard(
    board,
    board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => ({
        ...cell,
        start: floor.id === floorId && cell.id === cellId,
        end: floor.id === floorId && cell.id === cellId ? false : cell.end,
      })),
    })),
  );
}

export function setEndCell(board: Board, floorId: string, cellId: string): Board {
  const exists = board.floors.some(
    (floor) => floor.id === floorId && floor.cells.some((cell) => cell.id === cellId),
  );
  if (!exists) return board;
  return nextBoard(
    board,
    board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => ({
        ...cell,
        end: floor.id === floorId && cell.id === cellId,
        start: floor.id === floorId && cell.id === cellId ? false : cell.start,
      })),
    })),
  );
}

export function addFloor(board: Board, id: string, label: string, shape?: BoardShape): Board {
  if (board.floors.some((floor) => floor.id === id)) return board;
  const shapeInput = normalizeShape(shape ?? board.floors.at(-1)?.shape);
  const floor = createLoopedFloor(id, label, board.floors.length, shapeInput);
  return nextBoard(board, [...board.floors, floor]);
}

export function renameFloor(board: Board, floorId: string, label: string): Board {
  const trimmed = label.trim();
  if (!trimmed) return board;
  return nextBoard(
    board,
    board.floors.map((floor) => (floor.id === floorId ? { ...floor, label: trimmed } : floor)),
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
  return createBoard(floors, stairs, dropRoomsOnFloor(board, floorId));
}

export function nextStairId(cellId: string): string {
  return `s-${cellId}`;
}

export function attachStair(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell || cell.kind === 'stair' || cell.kind === 'room') {
    return board;
  }
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
  return createBoard(
    floors,
    [
      ...board.stairs,
      { id: stairId, fromFloorId: floorId, toFloorId: '', toCellId: '', legal: false },
    ],
    board.rooms,
  );
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
    board.rooms,
  );
}

export function setHudWidget(board: Board, floorId: string, cellId: string, widget: HudWidget): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell || cell.kind !== 'hud') return board;
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((c) => {
      if (c.id !== cellId) return c;
      if (widget === 'empty') {
        const { hudWidget: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, hudWidget: widget };
    }),
  }));
}

export function setFloorHold(
  board: Board,
  floorId: string,
  patch: { holdEnabled?: boolean; holdQuotas?: Record<string, number> },
): Board {
  return mapFloor(board, floorId, (current) => {
    const next = { ...current };
    if ('holdEnabled' in patch) next.holdEnabled = patch.holdEnabled;
    if (patch.holdQuotas) {
      next.holdQuotas = Object.fromEntries(
        Object.entries(patch.holdQuotas).filter(([, quota]) => quota > 0),
      );
    }
    return next;
  });
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
    board.rooms,
  );
}
