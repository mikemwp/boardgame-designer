import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, ensureBoardLayout, isHudSlot } from '@/lib/engine/layout';
import {
  addFloor,
  applyFloorShape,
  attachStair,
  clearStair,
  deleteFloor,
  eraseCell,
  linkStair,
  moveCell,
  moveCellToSlot,
  nextCellId,
  placeCorridor,
  placeCorridorOnSlot,
  placeDoor,
  placeHud,
  placeRoom,
  clearDoor,
  renameFloor,
  setCellPack,
  setEndCell,
  setFloorHold,
  setHudWidget,
  setStartCell,
  setCellAudio,
  setCellImage,
  setCellVideo,
} from '@/lib/designer/mutate';

function groundBoard() {
  return createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
}

describe('placeCorridor', () => {
  it('rejects HUD and occupied slots, then appends on the perimeter', () => {
    const board = groundBoard();
    const floor = board.floors[0]!;
    const hudCol = floor.hud!.col;
    const hudRow = floor.hud!.row;
    expect(isHudSlot(floor, hudCol, hudRow)).toBe(true);
    expect(placeCorridor(board, 'ground', hudCol, hudRow, 'ground-c99')).toEqual(board);
    expect(placeCorridor(board, 'ground', 0, 0, 'ground-c99')).toEqual(board);
    const next = placeCorridor(board, 'ground', 1, 1, 'ground-c99');
    expect(next.floors[0]?.cells.some((c) => c.id === 'ground-c99')).toBe(true);
    expect(next.floors[0]?.cells.find((c) => c.id === 'ground-c99')).toMatchObject({
      kind: 'corridor',
      col: 1,
      row: 1,
    });
  });
});

describe('placeHud', () => {
  it('places HUD on any free square including the inner ring', () => {
    const board = groundBoard();
    const floor = board.floors[0]!;
    const hudCol = floor.hud!.col;
    const hudRow = floor.hud!.row;
    const inner = placeHud(board, 'ground', 1, 1, 'ground-h99');
    expect(inner.floors[0]?.cells.find((c) => c.id === 'ground-h99')).toMatchObject({
      kind: 'hud',
      col: 1,
      row: 1,
    });
    expect(placeHud(board, 'ground', 0, 0, 'ground-h98')).toEqual(board);
    const erased = eraseCell(board, 'ground', `ground-h0`);
    const next = placeHud(erased, 'ground', hudCol, hudRow, 'ground-h97');
    expect(next.floors[0]?.cells.find((c) => c.id === 'ground-h97')).toMatchObject({
      kind: 'hud',
      col: hudCol,
      row: hudRow,
    });
  });
});

describe('placeRoom and placeDoor', () => {
  it('places a room on an inner square and converts an adjacent corridor to a door', () => {
    const placed = placeRoom(groundBoard(), 'ground', 1, 1, 'ground-room');
    const room = placed.floors[0]?.cells.find((c) => c.id === 'ground-room');
    expect(room).toMatchObject({ kind: 'room', col: 1, row: 1 });
    expect(placeRoom(placed, 'ground', 1, 1, 'ground-room-2')).toEqual(placed);

    const neighbor = placed.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    const withDoor = placeDoor(placed, 'ground', neighbor.id);
    expect(withDoor.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('door');
    expect(placeDoor(placed, 'ground', 'ground-c0').floors[0]?.cells.find((c) => c.id === 'ground-c0')?.kind).not.toBe(
      'door',
    );

    const cleared = clearDoor(withDoor, 'ground', neighbor.id);
    expect(cleared.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('corridor');
  });

  it('assigns a pack on a room and refuses a pack on a door', () => {
    let board = placeRoom(groundBoard(), 'ground', 1, 1, 'ground-room');
    const neighbor = board.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    board = placeDoor(board, 'ground', neighbor.id);
    board = setCellPack(board, 'ground', 'ground-room', 'notes');
    expect(board.floors[0]?.cells.find((c) => c.id === 'ground-room')?.packId).toBe('notes');
    const refused = setCellPack(board, 'ground', neighbor.id, 'notes');
    expect(refused.floors[0]?.cells.find((c) => c.id === neighbor.id)?.packId).toBeUndefined();
  });
});

describe('moveCell and eraseCell', () => {
  it('moves a cell onto an empty slot and erase drops it', () => {
    const moved = moveCell(groundBoard(), 'ground', 'ground-c27', 1, 1);
    expect(moved.floors[0]?.cells.find((c) => c.id === 'ground-c27')).toMatchObject({
      col: 1,
      row: 1,
    });
    const erased = eraseCell(moved, 'ground', 'ground-c27');
    expect(erased.floors[0]?.cells.some((c) => c.id === 'ground-c27')).toBe(false);
  });

  it('erase of a HUD tile frees the square for a corridor', () => {
    const board = groundBoard();
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const erased = eraseCell(board, 'ground', hud.id);
    expect(erased.floors[0]?.cells.some((c) => c.id === hud.id)).toBe(false);
    expect(erased.floors[0]?.cells.some((c) => c.col === hud.col && c.row === hud.row)).toBe(false);
    const placed = placeCorridor(erased, 'ground', hud.col!, hud.row!, 'ground-c99');
    expect(placed.floors[0]?.cells.find((c) => c.id === 'ground-c99')).toMatchObject({
      kind: 'corridor',
      col: hud.col,
      row: hud.row,
    });
  });

  it('erase of stair, start, and end tiles leaves an empty square', () => {
    let board = setStartCell(groundBoard(), 'ground', 'ground-c0');
    board = attachStair(board, 'ground', 'ground-c3');
    board = setEndCell(board, 'ground', 'ground-c5');
    for (const id of ['ground-c0', 'ground-c3', 'ground-c5'] as const) {
      const cell = board.floors[0]!.cells.find((c) => c.id === id)!;
      board = eraseCell(board, 'ground', id);
      expect(board.floors[0]?.cells.some((c) => c.id === id)).toBe(false);
      expect(board.floors[0]?.cells.some((c) => c.col === cell.col && c.row === cell.row)).toBe(
        false,
      );
    }
    expect(board.stairs).toHaveLength(0);
  });
});

describe('setCellPack, setStartCell, and setEndCell', () => {
  it('assigns a pack on corridor only and keeps a single start', () => {
    const packed = setCellPack(groundBoard(), 'ground', 'ground-c1', 'notes');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBe('notes');
    const started = setStartCell(packed, 'ground', 'ground-c1');
    const starts = started.floors[0]!.cells.filter((c) => c.start);
    expect(starts.map((c) => c.id)).toEqual(['ground-c1']);
  });

  it('keeps a single end tile and clears start/end overlap', () => {
    const started = setStartCell(groundBoard(), 'ground', 'ground-c0');
    const ended = setEndCell(started, 'ground', 'ground-c2');
    expect(ended.floors[0]?.cells.find((c) => c.id === 'ground-c2')?.end).toBe(true);
    expect(ended.floors[0]?.cells.filter((c) => c.end).map((c) => c.id)).toEqual(['ground-c2']);
    const movedStart = setStartCell(ended, 'ground', 'ground-c2');
    expect(movedStart.floors[0]?.cells.find((c) => c.id === 'ground-c2')?.start).toBe(true);
    expect(movedStart.floors[0]?.cells.find((c) => c.id === 'ground-c2')?.end).toBe(false);
  });
});

describe('floors', () => {
  it('adds, renames, and refuses to delete the last floor', () => {
    const added = addFloor(groundBoard(), 'floor-1', 'Cellar');
    expect(added.floors.map((f) => f.id)).toEqual(['ground', 'floor-1']);
    expect(added.floors[1]?.index).toBe(1);
    expect(added.floors[1]?.cells.filter((c) => c.kind === 'corridor')).toHaveLength(28);
    const renamed = renameFloor(added, 'floor-1', 'Basement');
    expect(renamed.floors[1]?.label).toBe('Basement');
    const deleted = deleteFloor(renamed, 'floor-1');
    expect(deleted.floors).toHaveLength(1);
    expect(deleteFloor(deleted, 'ground').floors).toHaveLength(1);
  });

  it('deletes only the chosen level and keeps remaining order', () => {
    let board = addFloor(groundBoard(), 'floor-1', 'Level 2');
    board = addFloor(board, 'floor-2', 'Level 3');
    board = addFloor(board, 'floor-3', 'Level 4');
    const deleted = deleteFloor(board, 'floor-2');
    expect(deleted.floors.map((f) => f.label)).toEqual(['Ground', 'Level 2', 'Level 4']);
    expect(deleted.floors.map((f) => f.id)).toEqual(['ground', 'floor-1', 'floor-3']);
    expect(deleted.floors[0]?.index).toBe(0);
  });
});

describe('stairs', () => {
  it('attaches a dangling stair, links it, and can convert back to corridor', () => {
    const two = addFloor(groundBoard(), 'floor-1', 'Floor 1');
    const attached = attachStair(two, 'ground', 'ground-c3');
    const cell = attached.floors[0]?.cells.find((c) => c.id === 'ground-c3');
    expect(cell?.kind).toBe('stair');
    expect(cell?.packId).toBeUndefined();
    const stair = attached.stairs.find((s) => s.id === cell?.stairId);
    expect(stair).toMatchObject({
      fromFloorId: 'ground',
      toFloorId: '',
      toCellId: '',
      legal: false,
    });
    const linked = linkStair(attached, stair!.id, 'floor-1', 'floor-1-c0');
    expect(linked.stairs[0]).toMatchObject({
      toFloorId: 'floor-1',
      toCellId: 'floor-1-c0',
      legal: true,
    });
    const cleared = clearStair(linked, 'ground', 'ground-c3');
    expect(cleared.stairs).toHaveLength(0);
    expect(cleared.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.kind).toBe('corridor');
  });

  it('does not put a pack on a stair', () => {
    const attached = attachStair(groundBoard(), 'ground', 'ground-c3');
    const packed = setCellPack(attached, 'ground', 'ground-c3', 'climb');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.packId).toBeUndefined();
  });
});

describe('applyFloorShape', () => {
  it('refuses to reshape a floor that already has start and a pack', () => {
    let board = setCellPack(groundBoard(), 'ground', 'ground-c0', 'notes');
    board = setStartCell(board, 'ground', 'ground-c0');
    const next = applyFloorShape(board, 'ground', { kind: 'circle', tiles: 12 });
    expect(next).toBe(board);
    expect(next.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 8 });
  });

  it('does not allow rectangle sides to stay equal', () => {
    const next = applyFloorShape(groundBoard(), 'ground', {
      kind: 'rectangle',
      length: 6,
      width: 6,
    });
    expect(next.floors[0]?.shape).toEqual({ kind: 'rectangle', length: 6, width: 5 });
  });

  it('resizes 8×8 to 9×9 without HUD overwriting the perimeter loop', () => {
    const next = applyFloorShape(groundBoard(), 'ground', { kind: 'square', tilesPerSide: 9 });
    assertCartesianGeometry(next.floors[0]!, 9);
  });

  it('resizes 8×8 to 10×10 with HUD only in the true center', () => {
    const next = applyFloorShape(groundBoard(), 'ground', { kind: 'square', tilesPerSide: 10 });
    assertCartesianGeometry(next.floors[0]!, 10);
  });

  it('does not reshape a second level after an extra tile is painted', () => {
    let board = addFloor(groundBoard(), 'floor-1', 'Level 2');
    board = placeCorridor(board, 'floor-1', 1, 1, nextCellId(board.floors[1]!));
    const locked = applyFloorShape(board, 'floor-1', { kind: 'square', tilesPerSide: 6 });
    expect(locked).toBe(board);
    expect(locked.floors[1]?.shape).toEqual({ kind: 'square', tilesPerSide: 8 });
  });

  it('never emits duplicate ids such as floor-1-c24 across every square resize', () => {
    const sizes = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const from of sizes) {
      for (const to of sizes) {
        let board = addFloor(
          createBoard([createLoopedFloor('ground', 'Level 1', 0, { kind: 'square', tilesPerSide: from })], []),
          'floor-1',
          'Level 2',
          { kind: 'square', tilesPerSide: from },
        );
        const floor = board.floors[1]!;
        const ring = floor.cells.find((c) => c.kind !== 'hud' && c.id === 'floor-1-c24') ?? floor.cells.find((c) => c.kind !== 'hud');
        if (ring) board = eraseCell(board, 'floor-1', ring.id);
        const afterErase = board.floors[1]!;
        let placed = false;
        for (let row = 1; row < (afterErase.rows ?? 0) - 1 && !placed; row += 1) {
          for (let col = 1; col < (afterErase.columns ?? 0) - 1 && !placed; col += 1) {
            if (afterErase.cells.some((c) => c.col === col && c.row === row)) continue;
            board = placeCorridor(board, 'floor-1', col, row, nextCellId(afterErase));
            placed = true;
          }
        }
        board = applyFloorShape(board, 'floor-1', { kind: 'square', tilesPerSide: to });
        board = ensureBoardLayout(board);
        const ids = board.floors[1]!.cells.map((c) => c.id);
        expect(new Set(ids).size, `dups after ${from}→${to}: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(',')}`).toBe(
          ids.length,
        );
      }
    }
  });

  it('does not reshape after a HUD widget is set', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const marked = setHudWidget(board, 'ground', hud.id, 'player-bar');
    const resized = applyFloorShape(marked, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(resized).toBe(marked);
    expect(resized.floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBe('player-bar');
  });
});

describe('setHudWidget', () => {
  it('sets and clears a HUD widget and ignores corridor cells', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    const board = createBoard([floor], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const corridor = board.floors[0]!.cells.find((c) => c.kind === 'corridor')!;
    const next = setHudWidget(board, 'ground', hud.id, 'dice');
    expect(next.floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBe('dice');
    expect(setHudWidget(board, 'ground', corridor.id, 'dice')).toEqual(board);
    expect(setHudWidget(next, 'ground', hud.id, 'empty').floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBeUndefined();
  });
});

describe('setFloorHold', () => {
  it('toggles hold and drops non-positive quotas', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const next = setFloorHold(board, 'ground', { holdEnabled: true, holdQuotas: { climb: 2, notes: 0 } });
    expect(next.floors[0]?.holdEnabled).toBe(true);
    expect(next.floors[0]?.holdQuotas).toEqual({ climb: 2 });
  });
});

function assertCartesianGeometry(
  floor: { cells: Array<{ kind?: string; col?: number; row?: number }>; columns?: number; rows?: number; hud?: { col: number; row: number; width: number; height: number } },
  n: number,
) {
  expect(floor.columns).toBe(n);
  expect(floor.rows).toBe(n);
  expect(floor.hud).toEqual({ col: 2, row: 2, width: n - 4, height: n - 4 });
  const ring = floor.cells.filter((c) => c.kind !== 'hud');
  const hud = floor.cells.filter((c) => c.kind === 'hud');
  expect(ring).toHaveLength(4 * n - 4);
  expect(hud).toHaveLength((n - 4) * (n - 4));
  for (const cell of ring) {
    const onPerimeter =
      cell.col === 0 || cell.row === 0 || cell.col === n - 1 || cell.row === n - 1;
    expect(onPerimeter).toBe(true);
    expect(cell.kind === 'hud').toBe(false);
  }
  for (const cell of hud) {
    expect(cell.col).toBeGreaterThanOrEqual(2);
    expect(cell.row).toBeGreaterThanOrEqual(2);
    expect(cell.col).toBeLessThanOrEqual(n - 3);
    expect(cell.row).toBeLessThanOrEqual(n - 3);
  }
}

describe('setCellAudio', () => {
  const clip = {
    id: 'a1',
    name: 'land.mp3',
    source: 'url' as const,
    src: 'https://ex/land.mp3',
  };

  it('sets and clears corridor audio and refuses HUD and door', () => {
    const set = setCellAudio(groundBoard(), 'ground', 'ground-c1', clip);
    expect(set.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.audio).toEqual(clip);
    const cleared = setCellAudio(set, 'ground', 'ground-c1', undefined);
    expect(cleared.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.audio).toBeUndefined();

    const hud = groundBoard().floors[0]!.cells.find((c) => c.kind === 'hud')!;
    expect(setCellAudio(groundBoard(), 'ground', hud.id, clip).floors[0]?.cells.find((c) => c.id === hud.id)?.audio).toBeUndefined();

    let board = placeRoom(groundBoard(), 'ground', 1, 1, 'ground-room');
    const neighbor = board.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    board = placeDoor(board, 'ground', neighbor.id);
    expect(setCellAudio(board, 'ground', neighbor.id, clip).floors[0]?.cells.find((c) => c.id === neighbor.id)?.audio).toBeUndefined();
    const roomed = setCellAudio(board, 'ground', 'ground-room', clip);
    expect(roomed.floors[0]?.cells.find((c) => c.id === 'ground-room')?.audio).toEqual(clip);
  });

  it('keeps audio when reshaping the floor', () => {
    const marked = setCellAudio(groundBoard(), 'ground', 'ground-c0', clip);
    const resized = applyFloorShape(marked, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(resized.floors[0]?.cells.find((c) => c.id === 'ground-c0')?.audio).toEqual(clip);
  });
});

describe('setCellImage and setCellVideo', () => {
  const image = {
    id: 'img1',
    name: 'tile.png',
    source: 'url' as const,
    src: 'https://ex/tile.png',
  };
  const video = {
    id: 'vid1',
    name: 'cut.mp4',
    source: 'url' as const,
    src: 'https://ex/cut.mp4',
  };

  it('sets image and video independently of audio', () => {
    const clip = {
      id: 'a1',
      name: 'land.mp3',
      source: 'url' as const,
      src: 'https://ex/land.mp3',
    };
    let board = setCellAudio(groundBoard(), 'ground', 'ground-c1', clip);
    board = setCellImage(board, 'ground', 'ground-c1', image);
    board = setCellVideo(board, 'ground', 'ground-c1', video);
    const cell = board.floors[0]?.cells.find((c) => c.id === 'ground-c1');
    expect(cell).toMatchObject({ audio: clip, image, video });
    const clearedImage = setCellImage(board, 'ground', 'ground-c1', undefined);
    const after = clearedImage.floors[0]?.cells.find((c) => c.id === 'ground-c1');
    expect(after?.image).toBeUndefined();
    expect(after?.audio).toEqual(clip);
    expect(after?.video).toEqual(video);
  });
});

describe('applyFloorShape extra HUD', () => {
  it('keeps an inner-ring HUD tile when the square stays free', () => {
    const placed = placeHud(groundBoard(), 'ground', 1, 1, 'ground-h-ring');
    const resized = applyFloorShape(placed, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(resized.floors[0]?.cells.find((c) => c.id === 'ground-h-ring')).toMatchObject({
      kind: 'hud',
      col: 1,
      row: 1,
    });
  });
});

describe('polar place and move', () => {
  it('places into an erased circle wedge and moves with slot ids', () => {
    let board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 8 })],
      [],
    );
    const erasedId = board.floors[0]!.cells[3]!.id;
    board = eraseCell(board, 'ground', erasedId);
    const placed = placeCorridorOnSlot(board, 'ground', 'ring-3', 'ground-new');
    expect(placed.floors[0]?.cells.some((c) => c.slot === 3 && c.id === 'ground-new')).toBe(true);
    const moved = moveCellToSlot(placed, 'ground', 'ground-new', 'ring-3');
    expect(moved.floors[0]?.cells.find((c) => c.id === 'ground-new')?.slot).toBe(3);
  });
});
