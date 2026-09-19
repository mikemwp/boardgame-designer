import { describe, it, expect } from 'vitest';
import { rollInteger } from '@/lib/engine/dice';

describe('rollInteger', () => {
  it('returns integer in 1..sides using injected rng', () => {
    expect(rollInteger(6, () => 0)).toBe(1);
    expect(rollInteger(6, () => 0.999)).toBe(6);
  });
});
