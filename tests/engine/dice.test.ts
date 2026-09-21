import { describe, it, expect } from 'vitest';
import { diceSidesForCount, rollInteger } from '@/lib/engine/dice';

describe('rollInteger', () => {
  it('returns integer in 1..sides using injected rng', () => {
    expect(rollInteger(6, () => 0)).toBe(1);
    expect(rollInteger(6, () => 0.999)).toBe(6);
    expect(rollInteger(12, () => 0)).toBe(1);
    expect(rollInteger(12, () => 0.999)).toBe(12);
  });
});

describe('diceSidesForCount', () => {
  it('maps 1 die to d6 and 2 dice to 1-12 spinner range', () => {
    expect(diceSidesForCount(1)).toBe(6);
    expect(diceSidesForCount(2)).toBe(12);
  });
});
