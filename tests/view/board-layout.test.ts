import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HUD,
  areAdjacent,
  defaultLoopPositions,
  isHudSlot,
  squareRingCellCount,
  squareRingPositions,
  squareRingTilesPerSide,
} from '@/lib/engine/layout';
import { adjacentWorldDistance, cellToWorld, TILE_SIZE } from '@/lib/view/board-layout';

describe('square ring layout', () => {
  it('uses equal tile counts on each side of the HUD ring', () => {
    const tilesPerSide = squareRingTilesPerSide(8);
    expect(tilesPerSide).toBe(3);
    expect(squareRingCellCount(tilesPerSide)).toBe(8);

    const ring = squareRingPositions(DEFAULT_HUD, tilesPerSide);
    expect(ring).toHaveLength(8);
    expect(defaultLoopPositions(8)).toEqual(ring);

    const top = ring.filter(({ row }) => row === ring[0]!.row);
    const bottom = ring.filter(({ row }) => row === ring[ring.length - 3]!.row);
    const left = ring.filter(({ col }) => col === ring[0]!.col);
    const right = ring.filter(({ col }) => col === ring[tilesPerSide - 1]!.col);

    expect(top).toHaveLength(tilesPerSide);
    expect(bottom).toHaveLength(tilesPerSide);
    expect(left).toHaveLength(tilesPerSide);
    expect(right).toHaveLength(tilesPerSide);
  });

  it('keeps corridor cells off the HUD and 4-adjacent in loop order', () => {
    const ring = defaultLoopPositions(8);
    const floor = { hud: DEFAULT_HUD };
    for (const pos of ring) {
      expect(isHudSlot(floor as Parameters<typeof isHudSlot>[0], pos.col, pos.row)).toBe(false);
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
    const a = cellToWorld(0, { index: 0, col: ring[0]!.col, row: ring[0]!.row });
    const b = cellToWorld(0, { index: 1, col: ring[1]!.col, row: ring[1]!.row });
    expect(adjacentWorldDistance(a, b)).toBe(TILE_SIZE);
  });

  it('lays the ring on a square in XZ centered on the HUD', () => {
    const ring = defaultLoopPositions(8);
    const worlds = ring.map((pos, index) =>
      cellToWorld(0, { index, col: pos.col, row: pos.row }),
    );
    const xs = worlds.map((w) => w.x);
    const zs = worlds.map((w) => w.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2 * TILE_SIZE, 5);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(2 * TILE_SIZE, 5);
  });
});
