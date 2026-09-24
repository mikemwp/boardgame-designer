import type { Floor, RoomDef, Stair } from './types';

export interface Board {
  floors: Floor[];
  stairs: Stair[];
  rooms?: RoomDef[];
}

export function createBoard(floors: Floor[], stairs: Stair[], rooms?: RoomDef[]): Board {
  return {
    floors: [...floors],
    stairs: [...stairs],
    ...(rooms ? { rooms: [...rooms] } : {}),
  };
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
