import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, loopCells } from '@/lib/engine/layout';
import {
  attachRoom,
  attachStair,
  placeDoor,
  placeRoom,
  setCellPack,
} from '@/lib/designer/mutate';
import {
  nextRoomName,
  normalizeBoardRooms,
  normalizeRoomShape,
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

describe('placeDoor', () => {
  it('is a no-op and never writes a door', () => {
    const board = groundBoard();
    expect(placeDoor(board, 'ground', 'ground-c0')).toEqual(board);
    expect(board.floors[0]?.cells.every((c) => c.kind !== 'door')).toBe(true);
  });
});

describe('normalizeBoardRooms', () => {
  it('turns doors into corridors and drops off-path rooms while keeping packs', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const neighbor = floor.cells.find((c) => c.col === 1 && c.row === 0)!;
    const leftover = floor.cells.find((c) => c.col === 2 && c.row === 0)!;
    const draft = createBoard(
      [
        {
          ...floor,
          cells: [
            ...floor.cells.map((cell) => {
              if (cell.id === neighbor.id) return { ...cell, kind: 'door' as const };
              if (cell.id === leftover.id) return { ...cell, packId: 'notes' };
              return cell;
            }),
            { id: 'ground-room', index: 99, kind: 'room' as const, col: 1, row: 1, packId: 'closet' },
          ],
        },
      ],
      [],
    );
    const next = normalizeBoardRooms(draft);
    expect(next.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('corridor');
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
