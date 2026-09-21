export type Rng = () => number;
export type DiceCount = 1 | 2;

export function diceSidesForCount(count: DiceCount): number {
  return count === 2 ? 12 : 6;
}

export function rollInteger(sides: number, rng: Rng = Math.random): number {
  if (sides < 1) throw new Error('sides must be >= 1');
  return Math.floor(rng() * sides) + 1;
}

export interface DiceRollEvent {
  type: 'DICE_ROLLED';
  value: number;
  sides: number;
}

export function createDiceRollEvent(value: number, sides: number): DiceRollEvent {
  return { type: 'DICE_ROLLED', value, sides };
}
