import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CIRCLE_TILES,
  DEFAULT_SHAPE,
  inferShape,
  normalizeShape,
  shapeCellCount,
} from '@/lib/engine/shape';

describe('normalizeShape', () => {
  it('defaults a new draft to square 8×8', () => {
    expect(normalizeShape(undefined)).toEqual(DEFAULT_SHAPE);
    expect(DEFAULT_SHAPE).toEqual({ kind: 'square', tilesPerSide: 8 });
    expect(shapeCellCount(DEFAULT_SHAPE)).toBe(28);
  });

  it('clamps square tiles per side to 3–12', () => {
    expect(normalizeShape({ kind: 'square', tilesPerSide: 2 })).toEqual({
      kind: 'square',
      tilesPerSide: 3,
    });
    expect(normalizeShape({ kind: 'square', tilesPerSide: 99 })).toEqual({
      kind: 'square',
      tilesPerSide: 12,
    });
  });

  it('defaults rectangle to 8×6, clamps 3–12, and refuses equal sides', () => {
    expect(normalizeShape({ kind: 'rectangle' })).toEqual({
      kind: 'rectangle',
      length: 8,
      width: 6,
    });
    expect(shapeCellCount({ kind: 'rectangle', length: 8, width: 6 })).toBe(24);
    expect(normalizeShape({ kind: 'rectangle', length: 8, width: 8 })).toEqual({
      kind: 'rectangle',
      length: 8,
      width: 7,
    });
    expect(normalizeShape({ kind: 'rectangle', length: 3, width: 3 })).toEqual({
      kind: 'rectangle',
      length: 3,
      width: 4,
    });
  });

  it('defaults circle to 12 tiles and clamps 3–40', () => {
    expect(normalizeShape({ kind: 'circle' })).toEqual({
      kind: 'circle',
      tiles: DEFAULT_CIRCLE_TILES,
    });
    expect(shapeCellCount({ kind: 'circle', tiles: 12 })).toBe(12);
    expect(normalizeShape({ kind: 'circle', tiles: 1 }).tiles).toBe(3);
    expect(normalizeShape({ kind: 'circle', tiles: 80 }).tiles).toBe(40);
  });

  it('defaults hub/spoke to 12 hub, 4 spokes, 6 spoke tiles', () => {
    const shape = normalizeShape({ kind: 'hub-spoke' });
    expect(shape).toEqual({
      kind: 'hub-spoke',
      hubTiles: 12,
      spokeCount: 4,
      spokeTiles: 6,
    });
    expect(shapeCellCount(shape)).toBe(12 + 4 * 6);
  });

  it('defaults hub/spoke/wheel to 8 hub, 4 spokes, 4 spoke tiles, 16 wheel', () => {
    const shape = normalizeShape({ kind: 'hub-spoke-wheel' });
    expect(shape).toEqual({
      kind: 'hub-spoke-wheel',
      hubTiles: 8,
      spokeCount: 4,
      spokeTiles: 4,
      wheelTiles: 16,
    });
    expect(shapeCellCount(shape)).toBe(8 + 4 * 4 + 16);
  });

  it('clamps hub 3–40, spokes 2–12, spoke tiles 1–12, wheel 3–40', () => {
    expect(
      normalizeShape({
        kind: 'hub-spoke-wheel',
        hubTiles: 1,
        spokeCount: 1,
        spokeTiles: 0,
        wheelTiles: 2,
      }),
    ).toEqual({
      kind: 'hub-spoke-wheel',
      hubTiles: 3,
      spokeCount: 2,
      spokeTiles: 1,
      wheelTiles: 3,
    });
  });
});

describe('inferShape', () => {
  it('keeps an explicit shape and infers square 3 from an 8-cell old draft', () => {
    expect(
      inferShape({
        shape: { kind: 'circle', tiles: 10 },
        cells: [],
      }),
    ).toEqual({ kind: 'circle', tiles: 10 });
    expect(
      inferShape({
        columns: 8,
        rows: 7,
        cells: Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, index: i })),
      }),
    ).toEqual({ kind: 'square', tilesPerSide: 3 });
  });
});
