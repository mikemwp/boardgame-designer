import { sampleMoveValue } from './movement';
import { movementRangeForSpinner, sampleSpinnerMove } from './spinner';
import type { DiceCount, MovementViz, SpinnerDef } from './types';

export type Rng = () => number;
export type { DiceCount };

export interface DiceRollResult {
  value: number;
  faces: number[];
  sides: number;
}

export function movementRangeForCount(count: DiceCount): { min: number; max: number } {
  return count === 2 ? { min: 2, max: 12 } : { min: 1, max: 6 };
}

export function movementRange(viz: MovementViz, count: DiceCount): { min: number; max: number } {
  if (viz === 'spinner') {
    return count === 2 ? { min: 1, max: 12 } : { min: 1, max: 6 };
  }
  return movementRangeForCount(count);
}

export function rollInteger(sides: number, rng: Rng = Math.random): number {
  if (sides < 1) throw new Error('sides must be >= 1');
  return Math.floor(rng() * sides) + 1;
}

export function rollDiceMovement(
  count: DiceCount,
  allowed: number[],
  rng: Rng = Math.random,
): DiceRollResult {
  if (count === 1) {
    const value = sampleMoveValue(allowed, rng);
    return { value, faces: value > 0 ? [value] : [], sides: 6 };
  }
  const d1 = rollInteger(6, rng);
  const d2 = rollInteger(6, rng);
  const sum = d1 + d2;
  const value = allowed.includes(sum) ? sum : 0;
  return { value, faces: [d1, d2], sides: 12 };
}

export function sampleMovement(
  viz: MovementViz,
  count: DiceCount,
  allowed: number[],
  rng: Rng = Math.random,
  spinner?: SpinnerDef,
): DiceRollResult {
  if (viz === 'spinner' && spinner) {
    const { max } = movementRangeForSpinner(spinner);
    const { value } = sampleSpinnerMove(spinner, allowed, rng);
    return { value, faces: value > 0 ? [value] : [], sides: max };
  }
  if (viz === 'spinner') {
    const { max } = movementRange(viz, count);
    const value = sampleMoveValue(allowed, rng);
    return { value, faces: value > 0 ? [value] : [], sides: max };
  }
  return rollDiceMovement(count, allowed, rng);
}

export interface DiceRollEvent {
  type: 'DICE_ROLLED';
  value: number;
  sides: number;
}

export function createDiceRollEvent(value: number, sides: number): DiceRollEvent {
  return { type: 'DICE_ROLLED', value, sides };
}
