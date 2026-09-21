import { describe, it, expect } from 'vitest';
import { worldWaypoints } from '@/lib/view/board-layout';
import { climbSample } from '@/lib/samples/climb';
import { computeSlideFrame } from '@/components/board/TokenActor';

describe('computeSlideFrame', () => {
  it('returns start at t=0 and end at t=1', () => {
    const start = { x: 0, y: 0, z: 0 };
    const end = { x: 3, y: 2, z: 0 };
    expect(computeSlideFrame(start, end, 0)).toEqual(start);
    expect(computeSlideFrame(start, end, 1)).toEqual(end);
  });
});

describe('path slide waypoints', () => {
  it('interpolates through the first waypoint at t=0', () => {
    const points = worldWaypoints(
      climbSample.board,
      { floorId: 'lobby', cellId: 'lobby-c0' },
      { floorId: 'lobby', cellId: 'lobby-c2' },
    );
    expect(points.length).toBeGreaterThanOrEqual(2);
    const first = points[0]!;
    expect(computeSlideFrame(first, points[1]!, 0)).toEqual(first);
  });
});
