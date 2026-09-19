export type ActionMode = 'positive' | 'pass' | 'both' | 'neither';

export interface Cell {
  id: string;
  index: number;
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
}

export interface TokenPos {
  floorId: string;
  cellId: string;
}

export interface Player {
  id: string;
  name: string;
  token: TokenPos;
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

export interface GameConfig {
  actionMode: ActionMode;
  diceEnabled: boolean;
  holdEnabled: boolean;
  diceSides: number;
  maxPlayers?: number;
  maxFloors?: number;
}

export function defaultGameConfig(): GameConfig {
  return {
    actionMode: 'both',
    diceEnabled: false,
    holdEnabled: false,
    diceSides: 6,
  };
}
