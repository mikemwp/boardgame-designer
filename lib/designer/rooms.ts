import { createBoard, type Board } from '@/lib/engine/board';
import { createLoopedFloor, loopCells, retileFloor } from '@/lib/engine/layout';
import { inferShape } from '@/lib/engine/shape';
import type { BoardShape, Cell, Floor, RoomDef, RoomMode, ShapeKind } from '@/lib/engine/types';

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function nextRoomId(board: Board): string {
  const rooms = board.rooms ?? [];
  let i = 1;
  while (rooms.some((room) => room.id === `room-${i}`)) i += 1;
  return `room-${i}`;
}

export function nextRoomName(rooms: RoomDef[]): string {
  let n = rooms.length + 1;
  while (rooms.some((room) => room.name === `Room ${n}`)) n += 1;
  return `Room ${n}`;
}

export function normalizeRoomShape(
  input: (Partial<BoardShape> & { kind?: ShapeKind }) | undefined,
): BoardShape {
  const kind = input?.kind;
  if (kind === 'rectangle') {
    let length = clamp(Number((input as { length?: number }).length ?? 5), 3, 5);
    let width = clamp(Number((input as { width?: number }).width ?? 4), 3, 5);
    if (length > 4 && width > 4) width = 4;
    if (length === width) {
      if (width > 3) width -= 1;
      else width += 1;
    }
    if (Math.max(length, width) > 5 || Math.min(length, width) > 4) {
      if (length >= width) {
        length = Math.min(length, 5);
        width = Math.min(width, 4);
      } else {
        width = Math.min(width, 5);
        length = Math.min(length, 4);
      }
    }
    return { kind: 'rectangle', length, width };
  }
  const tilesPerSide = clamp(
    'tilesPerSide' in (input ?? {}) ? Number((input as { tilesPerSide?: number }).tilesPerSide) : 3,
    3,
    4,
  );
  return { kind: 'square', tilesPerSide };
}

function isOnGeneratedLoop(floor: Board['floors'][0], cell: Cell): boolean {
  const template = createLoopedFloor(floor.id, floor.label, floor.index, floor.shape ?? inferShape(floor));
  return template.cells.some((slot) => {
    if (slot.kind === 'hud') return false;
    if (cell.col !== undefined && cell.row !== undefined && slot.col === cell.col && slot.row === cell.row) {
      return true;
    }
    return (
      slot.region === cell.region &&
      (slot.spokeIndex ?? -1) === (cell.spokeIndex ?? -1) &&
      slot.slot === cell.slot &&
      cell.slot !== undefined
    );
  });
}

export function normalizeBoardRooms(board: Board): Board {
  let changed = false;
  const floors = board.floors.map((floor) => {
    const cells = floor.cells.filter((cell) => {
      if (cell.kind !== 'room') return true;
      if (isOnGeneratedLoop(floor, cell)) return true;
      changed = true;
      return false;
    });
    if (cells.length === floor.cells.length) return floor;
    return retileFloor({ ...floor, cells });
  });
  const hostIds = new Set(
    floors.flatMap((floor) =>
      floor.cells.filter((cell) => cell.kind === 'room' && cell.roomId).map((cell) => cell.roomId as string),
    ),
  );
  const rooms = (board.rooms ?? []).filter((room) => hostIds.has(room.id));
  if (!changed && rooms.length === (board.rooms ?? []).length) {
    return board;
  }
  return createBoard(floors, board.stairs, rooms.length > 0 ? rooms : undefined);
}

export function attachRoom(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((entry) => entry.id === floorId);
  const cell = floor?.cells.find((entry) => entry.id === cellId);
  if (!floor || !cell) return board;
  if (cell.kind === 'hud' || cell.kind === 'stair' || cell.kind === 'room') {
    return board;
  }
  const rooms = board.rooms ?? [];
  const id = nextRoomId(board);
  const def: RoomDef = { id, name: nextRoomName(rooms), mode: 'single' };
  const floors = board.floors.map((current) => {
    if (current.id !== floorId) return current;
    return retileFloor({
      ...current,
      cells: current.cells.map((entry) =>
        entry.id === cellId ? { ...entry, kind: 'room' as const, roomId: id } : entry,
      ),
    });
  });
  return createBoard(floors, board.stairs, [...rooms, def]);
}

export function roomById(board: Board, roomId: string | undefined): RoomDef | undefined {
  if (!roomId) return undefined;
  return (board.rooms ?? []).find((room) => room.id === roomId);
}

export function hostCellForRoom(board: Board, roomId: string): { floorId: string; cell: Cell } | undefined {
  for (const floor of board.floors) {
    const cell = floor.cells.find((entry) => entry.roomId === roomId);
    if (cell) return { floorId: floor.id, cell };
  }
  return undefined;
}

export function setRoomMode(board: Board, roomId: string, mode: RoomMode): Board {
  const rooms = board.rooms ?? [];
  const current = rooms.find((room) => room.id === roomId);
  if (!current || current.mode === mode) return board;
  const nextRooms = rooms.map((room) => {
    if (room.id !== roomId) return room;
    if (mode === 'single') {
      return { id: room.id, name: room.name, mode };
    }
    const shape = normalizeRoomShape(room.shape ?? { kind: 'square', tilesPerSide: 3 });
    const interior = createLoopedFloor(room.id, room.name, 0, shape);
    return { id: room.id, name: room.name, mode, shape, cells: interior.cells };
  });
  return createBoard(board.floors, board.stairs, nextRooms);
}

export function applyRoomShape(board: Board, roomId: string, shapeInput: BoardShape): Board {
  const rooms = board.rooms ?? [];
  const current = rooms.find((room) => room.id === roomId);
  if (!current || current.mode !== 'multi' || !isVanillaRoom(current)) return board;
  const shape = normalizeRoomShape(shapeInput);
  const interior = createLoopedFloor(current.id, current.name, 0, shape);
  return createBoard(
    board.floors,
    board.stairs,
    rooms.map((room) =>
      room.id === roomId ? { ...room, shape, cells: interior.cells } : room,
    ),
  );
}

export function renameRoom(board: Board, roomId: string, name: string): Board {
  const trimmed = name.trim();
  if (!trimmed) return board;
  const rooms = board.rooms ?? [];
  if (!rooms.some((room) => room.id === roomId)) return board;
  return createBoard(
    board.floors,
    board.stairs,
    rooms.map((room) => (room.id === roomId ? { ...room, name: trimmed } : room)),
  );
}

export function isVanillaRoom(room: RoomDef): boolean {
  if (room.mode !== 'multi') return false;
  const shape = normalizeRoomShape(room.shape ?? { kind: 'square', tilesPerSide: 3 });
  const template = createLoopedFloor(room.id, room.name, 0, shape);
  const cells = room.cells ?? [];
  if (cells.length !== template.cells.length) return false;
  const templateByPos = new Map<string, Cell>();
  for (const cell of template.cells) {
    if (cell.col === undefined || cell.row === undefined) return false;
    templateByPos.set(`${cell.col},${cell.row}`, cell);
  }
  const seen = new Set<string>();
  for (const cell of cells) {
    if (cell.col === undefined || cell.row === undefined) return false;
    const expected = templateByPos.get(`${cell.col},${cell.row}`);
    if (!expected || expected.kind !== cell.kind) return false;
    if (
      cell.start ||
      cell.end ||
      cell.packId ||
      cell.spinnerId ||
      cell.audio ||
      cell.image ||
      cell.video ||
      cell.hudWidget ||
      cell.stairId ||
      cell.roomId ||
      cell.kind === 'stair' ||
      cell.kind === 'room'
    ) {
      return false;
    }
    seen.add(`${cell.col},${cell.row}`);
  }
  return seen.size === templateByPos.size;
}

export function resetRoom(board: Board, roomId: string): Board {
  const rooms = board.rooms ?? [];
  const current = rooms.find((room) => room.id === roomId);
  if (!current || current.mode !== 'multi') return board;
  const shape = normalizeRoomShape(current.shape ?? { kind: 'square', tilesPerSide: 3 });
  const interior = createLoopedFloor(current.id, current.name, 0, shape);
  return createBoard(
    board.floors,
    board.stairs,
    rooms.map((room) =>
      room.id === roomId ? { ...room, shape, cells: interior.cells } : room,
    ),
  );
}

export function deleteRoom(board: Board, roomId: string): Board {
  const rooms = board.rooms ?? [];
  if (!rooms.some((room) => room.id === roomId)) return board;
  const floors = board.floors.map((floor) =>
    retileFloor({
      ...floor,
      cells: floor.cells.map((cell) => {
        if (cell.roomId !== roomId) return cell;
        const { roomId: _drop, ...rest } = cell;
        return { ...rest, kind: 'corridor' as const };
      }),
    }),
  );
  const nextRooms = rooms.filter((room) => room.id !== roomId);
  return createBoard(floors, board.stairs, nextRooms.length > 0 ? nextRooms : undefined);
}

export function dropRoomsOnFloor(board: Board, floorId: string): RoomDef[] | undefined {
  const hosts = new Set(
    board.floors
      .find((floor) => floor.id === floorId)
      ?.cells.filter((cell) => cell.roomId)
      .map((cell) => cell.roomId as string) ?? [],
  );
  const rooms = (board.rooms ?? []).filter((room) => !hosts.has(room.id));
  return rooms.length > 0 ? rooms : undefined;
}

export function roomAsFloor(room: RoomDef): Floor {
  const shape = normalizeRoomShape(room.shape ?? { kind: 'square', tilesPerSide: 3 });
  const template = createLoopedFloor(room.id, room.name, 0, shape);
  return {
    ...template,
    label: room.name,
    cells: room.cells && room.cells.length > 0 ? room.cells : template.cells,
  };
}

export function replaceRoomFloor(board: Board, roomId: string, floor: Floor): Board {
  const rooms = board.rooms ?? [];
  if (!rooms.some((room) => room.id === roomId)) return board;
  return createBoard(
    board.floors,
    board.stairs,
    rooms.map((room) =>
      room.id === roomId
        ? { ...room, name: floor.label || room.name, shape: floor.shape ?? room.shape, cells: floor.cells }
        : room,
    ),
  );
}

export function roomHasWalkableInterior(room: RoomDef): boolean {
  if (room.mode !== 'multi') return true;
  return loopCells({
    id: room.id,
    index: 0,
    label: room.name,
    cells: room.cells ?? [],
    shape: room.shape,
  }).length >= 4;
}
