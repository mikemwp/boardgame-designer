import type { Board } from '@/lib/engine/board';
import { getFloor } from '@/lib/engine/board';
import { DEFAULT_HUD } from '@/lib/engine/layout';
import { forwardPathCells, forwardPathSteps } from '@/lib/engine/movement';
import type { HudRect, TokenPos } from '@/lib/engine/types';

const FLOOR_HEIGHT = 2;
export const TILE_SIZE = 1;

export interface Vec3 { x: number; y: number; z: number }

function hudOrigin(hud: HudRect = DEFAULT_HUD): { col: number; row: number } {
  return {
    col: hud.col + hud.width / 2 - 0.5,
    row: hud.row + hud.height / 2 - 0.5,
  };
}

export function gridToWorld(
  floorIndex: number,
  col: number,
  row: number,
  hud: HudRect = DEFAULT_HUD,
): Vec3 {
  const origin = hudOrigin(hud);
  return {
    x: (col - origin.col) * TILE_SIZE,
    y: floorIndex * FLOOR_HEIGHT,
    z: (row - origin.row) * TILE_SIZE,
  };
}

export function adjacentWorldDistance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function cellToWorld(
  floorIndex: number,
  cell: { col?: number; row?: number; index: number },
  hud: HudRect = DEFAULT_HUD,
): Vec3 {
  if (cell.col !== undefined && cell.row !== undefined) {
    return gridToWorld(floorIndex, cell.col, cell.row, hud);
  }
  return { x: 0, y: floorIndex * FLOOR_HEIGHT, z: 0 };
}

export function tokenPosToWorld(
  board: {
    floors: Array<{
      id: string;
      index: number;
      hud?: HudRect;
      cells: Array<{ id: string; index: number; col?: number; row?: number }>;
    }>;
  },
  token: { floorId: string; cellId: string },
): Vec3 {
  const floor = board.floors.find((f) => f.id === token.floorId);
  const cell = floor?.cells.find((c) => c.id === token.cellId);
  if (!floor || !cell) return { x: 0, y: 0, z: 0 };
  return cellToWorld(floor.index, cell, floor.hud);
}

export function worldWaypoints(board: Board, from: TokenPos, to: TokenPos, steps?: number): Vec3[] {
  if (from.floorId !== to.floorId) {
    return [tokenPosToWorld(board, to)];
  }
  const floor = getFloor(board, from.floorId);
  if (!floor) return [tokenPosToWorld(board, to)];
  if (from.cellId === to.cellId && steps && steps > 0) {
    const cells = forwardPathSteps(floor, from.cellId, steps);
    if (cells.length === 0) return [tokenPosToWorld(board, to)];
    return cells.map((cell) => tokenPosToWorld(board, { floorId: from.floorId, cellId: cell.id }));
  }
  const cells = forwardPathCells(floor, from.cellId, to.cellId);
  if (cells.length === 0) return [tokenPosToWorld(board, to)];
  return cells.map((cell) => tokenPosToWorld(board, { floorId: from.floorId, cellId: cell.id }));
}
