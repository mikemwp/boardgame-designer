import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, defaultLoopPositions, DEFAULT_HUD } from '@/lib/engine/layout';
import type { Floor } from '@/lib/engine/types';
import {
  boardWorldBounds,
  orbitCameraLimits,
  TILE_SIZE,
} from '@/lib/view/board-layout';

function ringFloor(id: string, index: number): Floor {
  const positions = defaultLoopPositions(8);
  return {
    id,
    index,
    label: id,
    hud: { ...DEFAULT_HUD },
    cells: positions.map((pos, cellIndex) => ({
      id: `${id}-c${cellIndex}`,
      index: cellIndex,
      kind: 'corridor' as const,
      col: pos.col,
      row: pos.row,
    })),
  };
}

describe('boardWorldBounds', () => {
  it('wraps all placed cells with half-tile padding', () => {
    const board = createBoard([ringFloor('lobby', 0)], []);
    const bounds = boardWorldBounds(board);
    expect(bounds.maxX - bounds.minX).toBeCloseTo(3 * TILE_SIZE, 5);
    expect(bounds.maxZ - bounds.minZ).toBeCloseTo(3 * TILE_SIZE, 5);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxY).toBe(0);
  });

  it('stacks floor height for multi-floor boards', () => {
    const board = createBoard([ringFloor('lobby', 0), ringFloor('f1', 1)], []);
    const bounds = boardWorldBounds(board);
    expect(bounds.maxY - bounds.minY).toBeCloseTo(2, 5);
  });
});

describe('orbitCameraLimits', () => {
  it('keeps zoom inside a sensible range for the board span', () => {
    const board = createBoard([ringFloor('lobby', 0)], []);
    const limits = orbitCameraLimits(boardWorldBounds(board));
    expect(limits.distanceMin).toBeGreaterThan(TILE_SIZE);
    expect(limits.distanceMax).toBeGreaterThan(limits.distanceMin);
    expect(limits.defaultDistance).toBeGreaterThanOrEqual(limits.distanceMin);
    expect(limits.defaultDistance).toBeLessThanOrEqual(limits.distanceMax);
  });

  it('centers the pivot on the board footprint', () => {
    const board = createBoard([ringFloor('lobby', 0)], []);
    const bounds = boardWorldBounds(board);
    const limits = orbitCameraLimits(bounds);
    expect(limits.pivot.x).toBeCloseTo((bounds.minX + bounds.maxX) / 2, 5);
    expect(limits.pivot.z).toBeCloseTo((bounds.minZ + bounds.maxZ) / 2, 5);
  });

  it('frames a full circle floor from slot layout even before every wedge is edited', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 12 });
    const board = createBoard([floor], []);
    const bounds = boardWorldBounds(board);
    expect(bounds.maxX - bounds.minX).toBeGreaterThan(4);
    expect(bounds.maxZ - bounds.minZ).toBeGreaterThan(4);
    expect(Math.abs(bounds.minX + bounds.maxX)).toBeLessThan(0.01);
    expect(Math.abs(bounds.minZ + bounds.maxZ)).toBeLessThan(0.01);
  });
});
