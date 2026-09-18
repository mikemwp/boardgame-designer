import type { Floor, Stair } from './types';

export interface Board {
  floors: Floor[];
  stairs: Stair[];
}

export function createBoard(floors: Floor[], stairs: Stair[]): Board {
  return { floors: [...floors], stairs: [...stairs] };
}

export function getFloor(board: Board, floorId: string): Floor | undefined {
  return board.floors.find((f) => f.id === floorId);
}

export interface StairLanding {
  stairId: string;
  toFloorId: string;
  toCellId: string;
}

export function listIllegalStairLandings(board: Board, fromFloorId: string): StairLanding[] {
  return board.stairs
    .filter((s) => s.fromFloorId === fromFloorId && !s.legal)
    .map((s) => ({ stairId: s.id, toFloorId: s.toFloorId, toCellId: s.toCellId }));
}

export function listLegalStairLandings(board: Board, fromFloorId: string): StairLanding[] {
  return board.stairs
    .filter((s) => s.fromFloorId === fromFloorId && s.legal)
    .map((s) => ({ stairId: s.id, toFloorId: s.toFloorId, toCellId: s.toCellId }));
}
