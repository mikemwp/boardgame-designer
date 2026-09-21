import { describe, it, expect } from 'vitest';
import { cellToWorld, tokenPosToWorld, worldWaypoints } from '@/lib/view/board-layout';
import { lerpVec3 } from '@/lib/view/token-slide';
import { climbSample } from '@/lib/samples/climb';

describe('token slide', () => {
  it('maps floor index to increasing y', () => {
    expect(cellToWorld(0, 0).y).toBeLessThan(cellToWorld(2, 0).y);
  });

  it('lerps between positions', () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 0.5).x).toBe(5);
  });
});

describe('loop layout', () => {
  it('places distinct xz for adjacent cells on the same floor', () => {
    const a = tokenPosToWorld(climbSample.board, { floorId: 'lobby', cellId: 'lobby-c0' });
    const b = tokenPosToWorld(climbSample.board, { floorId: 'lobby', cellId: 'lobby-c1' });
    expect(a.x !== b.x || a.z !== b.z).toBe(true);
    expect(a.y).toBe(b.y);
  });

  it('builds waypoints along the loop instead of a single jump', () => {
    const points = worldWaypoints(
      climbSample.board,
      { floorId: 'lobby', cellId: 'lobby-c5' },
      { floorId: 'lobby', cellId: 'lobby-c1' },
    );
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it('full lap on a 6-cell loop slides through every cell, not a zero-distance stay', () => {
    const from = { floorId: 'lobby', cellId: 'lobby-c0' };
    const start = tokenPosToWorld(climbSample.board, from);
    const points = worldWaypoints(climbSample.board, from, from, 6);
    expect(points.length).toBe(6);
    expect(points.some((p) => Math.hypot(p.x - start.x, p.z - start.z) > 0.01)).toBe(true);
    const last = points[points.length - 1]!;
    expect(Math.hypot(last.x - start.x, last.z - start.z)).toBeLessThan(0.01);
  });
});
