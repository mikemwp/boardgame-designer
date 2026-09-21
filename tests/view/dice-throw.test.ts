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

  it('shows two d6 faces in 2-dice mode for spinner values 1-12', () => {
    expect(diceDisplayFaces(1, 2)).toEqual([1, 1]);
    expect(diceDisplayFaces(7, 2)).toEqual([1, 2]);
    expect(diceDisplayFaces(12, 2)).toEqual([6, 2]);
  });
});
