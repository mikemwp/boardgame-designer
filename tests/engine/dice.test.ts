import { describe, it, expect } from 'vitest';
import { movementRange, movementRangeForCount, rollDiceMovement, rollInteger, sampleMovement } from '@/lib/engine/dice';

describe('rollInteger', () => {
  it('returns integer in 1..sides using injected rng', () => {
    expect(rollInteger(6, () => 0)).toBe(1);
    expect(rollInteger(6, () => 0.999)).toBe(6);
  });
});

describe('movementRangeForCount', () => {
  it('maps 1 die to d6 and 2 dice to summed 2d6 range', () => {
    expect(movementRangeForCount(1)).toEqual({ min: 1, max: 6 });
    expect(movementRangeForCount(2)).toEqual({ min: 2, max: 12 });
  });
});

describe('rollDiceMovement', () => {
  it('samples one d6 in 1-die mode', () => {
    const result = rollDiceMovement(1, [1, 2, 3, 4, 5, 6], () => 0);
    expect(result.value).toBe(1);
    expect(result.faces).toEqual([1]);
    expect(result.sides).toBe(6);
  });

  it('sums two d6 in 2-dice mode (2-12, not spinner 1-12)', () => {
    const snakeEyes = rollDiceMovement(2, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], () => 0);
    expect(snakeEyes.value).toBe(2);
    expect(snakeEyes.faces).toEqual([1, 1]);

    let i = 0;
    const rng = () => (i++ === 0 ? 0.999 : 0.999);
    const boxcars = rollDiceMovement(2, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], rng);
    expect(boxcars.value).toBe(12);
    expect(boxcars.faces).toEqual([6, 6]);
  });

  it('returns 0 when 2d6 sum is not an allowed move', () => {
    const result = rollDiceMovement(2, [3, 4, 5], () => 0);
    expect(result.value).toBe(0);
    expect(result.faces).toEqual([1, 1]);
  });
});

describe('movementRange', () => {
  it('keeps 2d6 as 2-12 and spinner two-range as uniform 1-12', () => {
    expect(movementRange('dice', 1)).toEqual({ min: 1, max: 6 });
    expect(movementRange('dice', 2)).toEqual({ min: 2, max: 12 });
    expect(movementRange('spinner', 1)).toEqual({ min: 1, max: 6 });
    expect(movementRange('spinner', 2)).toEqual({ min: 1, max: 12 });
  });
});

describe('sampleMovement', () => {
  it('spinner two-range can land on 1 (dice 2d6 cannot)', () => {
    const spin = sampleMovement(
      'spinner',
      2,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      () => 0,
    );
    expect(spin.value).toBe(1);
    expect(spin.faces).toEqual([1]);
    expect(spin.sides).toBe(12);

    const dice = sampleMovement(
      'dice',
      2,
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      () => 0,
    );
    expect(dice.value).toBe(2);
    expect(dice.faces).toEqual([1, 1]);
  });

  it('spinner one-range samples uniformly from allowed 1-6', () => {
    const result = sampleMovement('spinner', 1, [1, 2, 3, 4, 5, 6], () => 0.999);
    expect(result.value).toBe(6);
    expect(result.faces).toEqual([6]);
    expect(result.sides).toBe(6);
  });
});
