export type ActionMode = 'positive' | 'pass' | 'both' | 'neither';

export type CellKind = 'corridor' | 'stair';

export interface Cell {
  id: string;
  index: number;
  kind?: CellKind;
  packId?: string;
  stairId?: string;
}

export interface Stair {
  id: string;
  fromFloorId: string;
  toFloorId: string;
  toCellId: string;
  legal: boolean;
}

export interface Floor {
  id: string;
  index: number;
  label: string;
  cells: Cell[];
  holdEnabled?: boolean;
  holdQuotas?: Record<string, number>;
}

export interface TokenPos {
  floorId: string;
  cellId: string;
}

export interface Player {
  id: string;
  name: string;
  token: TokenPos;
  passesLeftByPack?: Record<string, number>;
}

export interface Card {
  id: string;
  pack: string;
  title: string;
  body?: string;
  tags?: string[];
}

export interface CardPack {
  id: string;
  cards: Card[];
}

export type DiceCount = 1 | 2;

export type MovementViz = 'dice' | 'spinner';

export interface GameConfig {
  actionMode: ActionMode;
  diceEnabled: boolean;
  holdEnabled: boolean;
  passesEnabled: boolean;
  passesPerPack: Record<string, number>;
  diceCount: DiceCount;
  diceSides: number;
  movementViz: MovementViz;
  maxPlayers?: number;
  maxFloors?: number;
}

export function defaultGameConfig(): GameConfig {
  return {
    actionMode: 'both',
    diceEnabled: false,
    holdEnabled: false,
    passesEnabled: false,
    passesPerPack: {},
    diceCount: 1,
    diceSides: 6,
    movementViz: 'dice',
  };
}
