import { describe, it, expect } from 'vitest';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

describe('climb sample', () => {
  it('is labeled as bundled sample only', () => {
    expect(CLIMB_LABEL).toContain('sample');
  });

  it('provides multi-floor board without caps', () => {
    expect(climbSample.board.floors.length).toBeGreaterThanOrEqual(3);
  });
});
