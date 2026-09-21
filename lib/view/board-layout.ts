import type { Board } from '@/lib/engine/board';
import { getFloor } from '@/lib/engine/board';
import { forwardPathCells, forwardPathSteps } from '@/lib/engine/movement';
import type { TokenPos } from '@/lib/engine/types';

const FLOOR_HEIGHT = 2;
const CELL_SPACING = 1.5;

export interface Vec3 { x: number; y: number; z: number }

export function cellToWorld(floorIndex: number, cellIndex: number, cellCount = 6): Vec3 {
  const n = Math.max(cellCount, 1);
  if (n === 1) {
    return { x: 0, y: floorIndex * FLOOR_HEIGHT, z: 0 };
  }
  const radius = (CELL_SPACING * n) / (2 * Math.PI) * 1.8;
  const angle = (cellIndex / n) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    y: floorIndex * FLOOR_HEIGHT,
    z: Math.sin(angle) * radius,
  };
}

export function tokenPosToWorld(
  board: {
    floors: Array<{ id: string; index: number; cells: Array<{ id: string; index: number }> }>;
  },
  token: { floorId: string; cellId: string },
): Vec3 {
  const floor = board.floors.find((f) => f.id === token.floorId);
  const cell = floor?.cells.find((c) => c.id === token.cellId);
  if (!floor || !cell) return { x: 0, y: 0, z: 0 };
  return cellToWorld(floor.index, cell.index, floor.cells.length);
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
