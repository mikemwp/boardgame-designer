import { describe, it, expect } from 'vitest';
import {
  computeThrowImpulse,
  diceDisplayFaces,
  spawnPositionAboveFloor,
} from '@/lib/view/dice-throw';

describe('spawnPositionAboveFloor', () => {
  it('places die center just above the floor tile top', () => {
    const [x, y, z] = spawnPositionAboveFloor({ x: 2, y: 4, z: -1 });
    expect(x).toBe(2);
    expect(z).toBe(-1);
    expect(y).toBeGreaterThan(4);
    expect(y).toBeLessThan(5.2);
  });
});

describe('computeThrowImpulse', () => {
  it('applies upward impulse and torque per blueprint ranges', () => {
    const rng = (() => {
      let i = 0;
      const values = [0, 0, 0, 0, 0, 0];
      return () => values[i++] ?? 0;
    })();
    const { impulse, torque } = computeThrowImpulse(rng);
    expect(impulse.y).toBeGreaterThanOrEqual(8);
    expect(impulse.y).toBeLessThanOrEqual(12);
    expect(Math.abs(impulse.x)).toBeLessThanOrEqual(2.5);
    expect(Math.abs(impulse.z)).toBeLessThanOrEqual(2.5);
    expect(Math.abs(torque.x)).toBeLessThanOrEqual(10);
    expect(Math.abs(torque.y)).toBeLessThanOrEqual(10);
    expect(Math.abs(torque.z)).toBeLessThanOrEqual(10);
  });
});

describe('diceDisplayFaces', () => {
  it('shows one d6 face in 1-die mode', () => {
    expect(diceDisplayFaces(4, 1)).toEqual([4]);
  });

  it('uses engine faces for 2-dice mode when provided', () => {
    expect(diceDisplayFaces(7, 2, [3, 4])).toEqual([3, 4]);
  });

  it('falls back to a 2d6 split when faces are missing', () => {
    expect(diceDisplayFaces(7, 2)).toEqual([1, 6]);
  });
});
