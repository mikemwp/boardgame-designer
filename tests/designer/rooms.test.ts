import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, loopCells } from '@/lib/engine/layout';
import {
  attachRoom,
  attachStair,
  placeRoom,
  setCellPack,
} from '@/lib/designer/mutate';
import * as mutate from '@/lib/designer/mutate';
import {
  applyRoomShape,
  deleteRoom,
  isVanillaRoom,
  nextRoomName,
  normalizeBoardRooms,
  normalizeRoomShape,
  resetRoom,
  setRoomMode,
} from '@/lib/designer/rooms';

function groundBoard() {
  return createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
}

describe('attachRoom', () => {
  it('converts a corridor tile and keeps it on the loop', () => {
    const board = groundBoard();
    const next = attachRoom(board, 'ground', 'ground-c3');
    const cell = next.floors[0]?.cells.find((c) => c.id === 'ground-c3');
    expect(cell?.kind).toBe('room');
    expect(cell?.roomId).toBeTruthy();
    expect(next.rooms).toHaveLength(1);
    expect(next.rooms?.[0]).toMatchObject({
      id: cell?.roomId,
      name: 'Room 1',
      mode: 'single',
    });
    expect(loopCells(next.floors[0]!).some((c) => c.id === 'ground-c3')).toBe(true);
    expect(placeRoom(board, 'ground', 1, 1, 'ground-room')).toEqual(board);
  });

  it('rejects HUD, stair, and an existing room', () => {
    const board = groundBoard();
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    expect(attachRoom(board, 'ground', hud.id)).toEqual(board);

    const withStair = attachStair(board, 'ground', 'ground-c3');
    expect(attachRoom(withStair, 'ground', 'ground-c3')).toEqual(withStair);

    const withRoom = attachRoom(board, 'ground', 'ground-c3');
    expect(attachRoom(withRoom, 'ground', 'ground-c3')).toEqual(withRoom);
  });
});

describe('attachDoor', () => {
  it('converts a room corridor to a door and keeps one door', () => {
    let board = attachRoom(groundBoard(), 'ground', 'ground-c3');
    board = setRoomMode(board, board.rooms![0]!.id, 'multi');
    const roomFloor = {
      ...board.rooms![0]!,
      cells: board.rooms![0]!.cells ?? [],
    };
    const fake = createBoard(
      [
        {
          id: roomFloor.id,
          index: 0,
          label: roomFloor.name,
          cells: roomFloor.cells,
          shape: roomFloor.shape,
        },
      ],
      [],
    );
    const corridor = fake.floors[0]!.cells.find((c) => c.kind === 'corridor')!;
    const other = fake.floors[0]!.cells.find((c) => c.kind === 'corridor' && c.id !== corridor.id)!;
    const withDoor = mutate.attachDoor(fake, fake.floors[0]!.id, corridor.id);
    expect(withDoor.floors[0]?.cells.find((c) => c.id === corridor.id)).toMatchObject({
      kind: 'door',
      doorExit: 'leave-or-stay',
    });
    const moved = mutate.attachDoor(withDoor, fake.floors[0]!.id, other.id);
    expect(moved.floors[0]?.cells.find((c) => c.id === corridor.id)?.kind).toBe('corridor');
    expect(moved.floors[0]?.cells.find((c) => c.id === other.id)?.kind).toBe('door');
  });
});

describe('normalizeBoardRooms', () => {
  it('keeps a room host on the loop and drops an off-path leftover room', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const host = floor.cells.find((c) => c.col === 1 && c.row === 0)!;
    const leftover = floor.cells.find((c) => c.col === 2 && c.row === 0)!;
    const draft = createBoard(
      [
        {
          ...floor,
          cells: [
            ...floor.cells.map((cell) => {
              if (cell.id === host.id) return { ...cell, kind: 'room' as const, roomId: 'room-1' };
              if (cell.id === leftover.id) return { ...cell, packId: 'notes' };
              return cell;
            }),
            { id: 'ground-room', index: 99, kind: 'room' as const, col: 1, row: 1, packId: 'closet' },
          ],
        },
      ],
      [],
      [{ id: 'room-1', name: 'Room 1', mode: 'single' }],
    );
    const next = normalizeBoardRooms(draft);
    expect(next.floors[0]?.cells.find((c) => c.id === host.id)).toMatchObject({
      kind: 'room',
      roomId: 'room-1',
    });
    expect(next.floors[0]?.cells.some((c) => c.id === 'ground-room')).toBe(false);
    expect(next.floors[0]?.cells.find((c) => c.id === leftover.id)?.packId).toBe('notes');
    expect(setCellPack(next, 'ground', leftover.id, 'notes').floors[0]?.cells.find((c) => c.id === leftover.id)?.packId).toBe(
      'notes',
    );
  });

  it('leaves an empty board unchanged', () => {
    const board = groundBoard();
    expect(normalizeBoardRooms(board)).toEqual(board);
  });
});

describe('normalizeRoomShape', () => {
  it('caps multi rooms at square 4×4 and rectangle 5×4', () => {
    expect(normalizeRoomShape({ kind: 'square', tilesPerSide: 8 })).toEqual({
      kind: 'square',
      tilesPerSide: 4,
    });
    expect(normalizeRoomShape({ kind: 'square', tilesPerSide: 2 })).toEqual({
      kind: 'square',
      tilesPerSide: 3,
    });
    expect(normalizeRoomShape({ kind: 'rectangle', length: 8, width: 8 })).toEqual({
      kind: 'rectangle',
      length: 5,
      width: 4,
    });
    expect(normalizeRoomShape({ kind: 'rectangle', length: 5, width: 4 })).toEqual({
      kind: 'rectangle',
      length: 5,
      width: 4,
    });
    expect(normalizeRoomShape(undefined)).toEqual({ kind: 'square', tilesPerSide: 3 });
  });
});

describe('nextRoomName', () => {
  it('names rooms Room 1, Room 2, …', () => {
    expect(nextRoomName([])).toBe('Room 1');
    expect(nextRoomName([{ id: 'room-1', name: 'Room 1', mode: 'single' }])).toBe('Room 2');
  });
});

describe('multi-tile rooms', () => {
  it('fills every non-perimeter cell with HUD on a 4×4 room', () => {
    let board = attachRoom(groundBoard(), 'ground', 'ground-c3');
    board = setRoomMode(board, board.rooms![0]!.id, 'multi');
    board = applyRoomShape(board, board.rooms![0]!.id, { kind: 'square', tilesPerSide: 4 });
    const cells = board.rooms![0]!.cells!;
    const hud = cells.filter((c) => c.kind === 'hud');
    expect(hud).toHaveLength(4);
    expect(hud.every((c) => c.col !== 0 && c.row !== 0 && c.col !== 3 && c.row !== 3)).toBe(true);
    expect(isVanillaRoom(board.rooms![0]!)).toBe(true);
  });

  it('creates a vanilla 3×3 interior and locks after a pack is set', () => {
    let board = attachRoom(groundBoard(), 'ground', 'ground-c3');
    const roomId = board.rooms![0]!.id;
    board = setRoomMode(board, roomId, 'multi');
    const room = board.rooms![0]!;
    expect(room.mode).toBe('multi');
    expect(room.shape).toEqual({ kind: 'square', tilesPerSide: 3 });
    expect(isVanillaRoom(room)).toBe(true);
    expect(applyRoomShape(board, roomId, { kind: 'square', tilesPerSide: 4 }).rooms?.[0]?.shape).toEqual({
      kind: 'square',
      tilesPerSide: 4,
    });

    const painted = {
      ...board,
      rooms: board.rooms!.map((entry) => ({
        ...entry,
        cells: entry.cells!.map((cell, index) => (index === 0 ? { ...cell, packId: 'notes' } : cell)),
      })),
    };
    expect(isVanillaRoom(painted.rooms![0]!)).toBe(false);
    expect(applyRoomShape(painted, roomId, { kind: 'square', tilesPerSide: 3 })).toBe(painted);
  });

  it('resets a painted interior and deletes the only room back to corridor', () => {
    let board = attachRoom(groundBoard(), 'ground', 'ground-c3');
    const roomId = board.rooms![0]!.id;
    board = setRoomMode(board, roomId, 'multi');
    board = {
      ...board,
      rooms: board.rooms!.map((entry) => ({
        ...entry,
        cells: entry.cells!.map((cell, index) => (index === 0 ? { ...cell, packId: 'notes' } : cell)),
      })),
    };
    const reset = resetRoom(board, roomId);
    expect(isVanillaRoom(reset.rooms![0]!)).toBe(true);
    expect(reset.rooms![0]?.name).toBe('Room 1');

    const deleted = deleteRoom(reset, roomId);
    expect(deleted.rooms ?? []).toEqual([]);
    expect(deleted.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.kind).toBe('corridor');
  });
});
