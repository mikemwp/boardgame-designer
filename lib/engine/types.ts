export type ActionMode = 'positive' | 'pass' | 'both' | 'neither';

export type CellKind = 'corridor' | 'stair' | 'hud' | 'room' | 'door';

export type HudWidget = 'empty' | 'dice' | 'spinner' | 'last-roll' | 'player-bar';

export type CellRegion = 'ring' | 'hub' | 'spoke' | 'wheel';

export type ShapeKind =
  | 'square'
  | 'rectangle'
  | 'circle'
  | 'hub-spoke'
  | 'hub-spoke-wheel';

export interface SquareShape {
  kind: 'square';
  tilesPerSide: number;
}

export interface RectangleShape {
  kind: 'rectangle';
  length: number;
  width: number;
}

export interface CircleShape {
  kind: 'circle';
  tiles: number;
}

export interface HubSpokeShape {
  kind: 'hub-spoke';
  hubTiles: number;
  spokeCount: number;
  spokeTiles: number;
}

export interface HubSpokeWheelShape {
  kind: 'hub-spoke-wheel';
  hubTiles: number;
  spokeCount: number;
  spokeTiles: number;
  wheelTiles: number;
}

export type BoardShape =
  | SquareShape
  | RectangleShape
  | CircleShape
  | HubSpokeShape
  | HubSpokeWheelShape;

export interface HudRect {
  col: number;
  row: number;
  width: number;
  height: number;
}

export interface Cell {
  id: string;
  index: number;
  kind?: CellKind;
  packId?: string;
  stairId?: string;
  col?: number;
  row?: number;
  region?: CellRegion;
  spokeIndex?: number;
  slot?: number;
  start?: boolean;
  end?: boolean;
  hudWidget?: HudWidget;
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
  columns?: number;
  rows?: number;
  hud?: HudRect;
  shape?: BoardShape;
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
  timerSeconds?: number;
  extraButton?: string;
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
