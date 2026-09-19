import { describe, it, expect } from 'vitest';
import { computeSlideFrame } from '@/components/board/TokenActor';

describe('computeSlideFrame', () => {
  it('returns start at t=0 and end at t=1', () => {
    const start = { x: 0, y: 0, z: 0 };
    const end = { x: 3, y: 2, z: 0 };
    expect(computeSlideFrame(start, end, 0)).toEqual(start);
    expect(computeSlideFrame(start, end, 1)).toEqual(end);
  });
});
