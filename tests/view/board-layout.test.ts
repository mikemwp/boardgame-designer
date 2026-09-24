import { describe, it, expect } from 'vitest';
import {
  areAdjacent,
  createLoopedFloor,
  defaultLoopPositions,
  isHudSlot,
} from '@/lib/engine/layout';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { adjacentWorldDistance, cellToWorld, gridToWorld, TILE_SIZE } from '@/lib/view/board-layout';
import { orbitCameraPose } from '@/lib/view/orbit-camera';

describe('square ring layout', () => {
  it('uses equal tile counts on each side of the HUD ring', () => {
    const layout = buildShapeLayout({ kind: 'square', tilesPerSide: 3 });
    const ring = layout.slots.map((s) => ({ col: s.col!, row: s.row! }));
    expect(ring).toHaveLength(8);
    expect(defaultLoopPositions(8)).toEqual(ring);

    const tilesPerSide = 3;
    const minCol = Math.min(...ring.map((p) => p.col));
    const maxCol = Math.max(...ring.map((p) => p.col));
    const minRow = Math.min(...ring.map((p) => p.row));
    const maxRow = Math.max(...ring.map((p) => p.row));
    const top = ring.filter(({ row }) => row === minRow);
    const bottom = ring.filter(({ row }) => row === maxRow);
    const left = ring.filter(({ col }) => col === minCol);
    const right = ring.filter(({ col }) => col === maxCol);
    expect(maxCol - minCol + 1).toBe(tilesPerSide);
    expect(maxRow - minRow + 1).toBe(tilesPerSide);

    expect(top).toHaveLength(tilesPerSide);
    expect(bottom).toHaveLength(tilesPerSide);
    expect(left).toHaveLength(tilesPerSide);
    expect(right).toHaveLength(tilesPerSide);
  });

  it('keeps corridor cells off the HUD and 4-adjacent in loop order', () => {
    const ring = defaultLoopPositions(8);
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'square', tilesPerSide: 3 });
    for (const pos of ring) {
      expect(isHudSlot(floor, pos.col, pos.row)).toBe(false);
    }
    for (let i = 0; i < ring.length; i += 1) {
      const next = ring[(i + 1) % ring.length]!;
      expect(areAdjacent(ring[i]!, next)).toBe(true);
    }
  });
});

describe('cellToWorld', () => {
  it('places adjacent grid cells flush in world space', () => {
    const ring = defaultLoopPositions(8);
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'square', tilesPerSide: 3 });
    const a = cellToWorld(0, { index: 0, col: ring[0]!.col, row: ring[0]!.row }, floor.hud, floor);
    const b = cellToWorld(0, { index: 1, col: ring[1]!.col, row: ring[1]!.row }, floor.hud, floor);
    expect(adjacentWorldDistance(a, b)).toBe(TILE_SIZE);
  });

  it('lays the ring on a square in XZ centered on the HUD', () => {
    const ring = defaultLoopPositions(8);
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'square', tilesPerSide: 3 });
    const worlds = ring.map((pos, index) =>
      cellToWorld(0, { index, col: pos.col, row: pos.row }, floor.hud, floor),
    );
    const xs = worlds.map((w) => w.x);
    const zs = worlds.map((w) => w.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2 * TILE_SIZE, 5);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(2 * TILE_SIZE, 5);
  });

  it('places a painted inner-ring cell from col/row, not ring index', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'square', tilesPerSide: 8 });
    const painted = { id: 'ground-extra', index: 99, kind: 'corridor' as const, col: 3, row: 6 };
    const withPainted = { ...floor, cells: [...floor.cells, painted] };
    const world = cellToWorld(0, painted, floor.hud, withPainted);
    expect(world).toEqual(gridToWorld(0, 3, 6, floor.hud));
    const ringByIndex = floor.cells.find((c) => c.index === 99 || c.slot === 99);
    if (ringByIndex) {
      const ringWorld = cellToWorld(0, ringByIndex, floor.hud, floor);
      expect(world).not.toEqual(ringWorld);
    }
    const neighbor = cellToWorld(
      0,
      { index: 100, col: 3, row: 5 },
      floor.hud,
      withPainted,
    );
    expect(adjacentWorldDistance(world, neighbor)).toBe(TILE_SIZE);
    const before = { ...world };
    orbitCameraPose({ x: 0, y: 0, z: 0 }, 8, -85, 90);
    expect(cellToWorld(0, painted, floor.hud, withPainted)).toEqual(before);
  });
});
