import { describe, it, expect } from 'vitest';
import { cellToWorld } from '@/lib/view/board-layout';
import { lerpVec3 } from '@/lib/view/token-slide';

describe('token slide', () => {
  it('maps floor index to increasing y', () => {
    expect(cellToWorld(0, 0).y).toBeLessThan(cellToWorld(2, 0).y);
  });

  it('lerps between positions', () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 0.5).x).toBe(5);
  });
});
