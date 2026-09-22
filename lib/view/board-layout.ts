import type { Board } from '@/lib/engine/board';
import { getFloor } from '@/lib/engine/board';
import { DEFAULT_HUD } from '@/lib/engine/layout';
import { inferShape } from '@/lib/engine/shape';
import { buildShapeLayout, DESIGNER_POLAR_PAD, shapeSlotBounds } from '@/lib/engine/shape-layout';
import type { Cell, Floor, HudRect, TokenPos } from '@/lib/engine/types';
import { forwardPathCells, forwardPathSteps } from '@/lib/engine/movement';
import { polygonCentroid } from '@/lib/view/tile-geometry';
import type { Vec2 } from '@/lib/engine/shape-layout';

const FLOOR_HEIGHT = 2;
export const TILE_SIZE = 1;
const HALF_TILE = TILE_SIZE / 2;

export interface Vec3 { x: number; y: number; z: number }

export interface BoardWorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface OrbitCameraLimits {
  pivot: Vec3;
  distanceMin: number;
  distanceMax: number;
  defaultDistance: number;
}

const EMPTY_BOUNDS: BoardWorldBounds = {
  minX: -HALF_TILE,
  maxX: HALF_TILE,
  minY: 0,
  maxY: 0,
  minZ: -HALF_TILE,
  maxZ: HALF_TILE,
};

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

export function slotPolygon(floor: Floor, cell: Cell): Vec2[] {
  const shape = inferShape(floor);
  const layout = buildShapeLayout(shape);
  const slot = layout.slots.find(
    (s) =>
      s.region === (cell.region ?? 'ring') &&
      (s.spokeIndex ?? -1) === (cell.spokeIndex ?? -1) &&
      s.slot === (cell.slot ?? cell.index),
  );
  if (slot) return slot.polygon;
  if (cell.col !== undefined && cell.row !== undefined) {
    const x = cell.col;
    const z = cell.row;
    return [
      { x: x - 0.5, z: z - 0.5 },
      { x: x + 0.5, z: z - 0.5 },
      { x: x + 0.5, z: z + 0.5 },
      { x: x - 0.5, z: z + 0.5 },
    ];
  }
  return [];
}

export function cellToWorld(
  floorIndex: number,
  cell: { col?: number; row?: number; index: number; region?: Cell['region']; spokeIndex?: number; slot?: number },
  hud: HudRect = DEFAULT_HUD,
  floor?: Floor,
): Vec3 {
  if (floor) {
    const poly = slotPolygon(floor, cell as Cell);
    if (poly.length > 0) {
      const centroid = polygonCentroid(poly);
      return { x: centroid.x, y: floorIndex * FLOOR_HEIGHT, z: centroid.z };
    }
  }
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
      shape?: Floor['shape'];
      cells: Array<{ id: string; index: number; col?: number; row?: number; region?: Cell['region']; spokeIndex?: number; slot?: number }>;
    }>;
  },
  token: { floorId: string; cellId: string },
): Vec3 {
  const floor = board.floors.find((f) => f.id === token.floorId);
  const cell = floor?.cells.find((c) => c.id === token.cellId);
  if (!floor || !cell) return { x: 0, y: 0, z: 0 };
  return cellToWorld(floor.index, cell, floor.hud, floor as Floor);
}

function isPolarFloor(floor: Board['floors'][0]): boolean {
  const kind = inferShape(floor).kind;
  return kind === 'circle' || kind === 'hub-spoke' || kind === 'hub-spoke-wheel';
}

export function boardWorldBounds(board: Board): BoardWorldBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let hasCells = false;

  for (const floor of board.floors) {
    if (isPolarFloor(floor)) {
      const shape = inferShape(floor);
      const slotBounds = shapeSlotBounds(shape, DESIGNER_POLAR_PAD);
      const y = floor.index * FLOOR_HEIGHT;
      hasCells = true;
      minX = Math.min(minX, slotBounds.minX);
      maxX = Math.max(maxX, slotBounds.maxX);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, slotBounds.minZ);
      maxZ = Math.max(maxZ, slotBounds.maxZ);
    }

    for (const cell of floor.cells) {
      const poly = slotPolygon(floor, cell);
      if (poly.length > 0) {
        const y = floor.index * FLOOR_HEIGHT;
        hasCells = true;
        for (const p of poly) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          minZ = Math.min(minZ, p.z);
          maxZ = Math.max(maxZ, p.z);
        }
      } else if (cell.col !== undefined && cell.row !== undefined) {
        const world = cellToWorld(floor.index, cell, floor.hud);
        hasCells = true;
        minX = Math.min(minX, world.x - HALF_TILE);
        maxX = Math.max(maxX, world.x + HALF_TILE);
        minY = Math.min(minY, world.y);
        maxY = Math.max(maxY, world.y);
        minZ = Math.min(minZ, world.z - HALF_TILE);
        maxZ = Math.max(maxZ, world.z + HALF_TILE);
      }
    }
  }

  return hasCells
    ? { minX, maxX, minY, maxY, minZ, maxZ }
    : { ...EMPTY_BOUNDS };
}

export function orbitCameraLimits(bounds: BoardWorldBounds): OrbitCameraLimits {
  const spanX = Math.max(bounds.maxX - bounds.minX, TILE_SIZE);
  const spanZ = Math.max(bounds.maxZ - bounds.minZ, TILE_SIZE);
  const spanY = Math.max(bounds.maxY - bounds.minY, 0);
  const span = Math.max(spanX, spanZ, TILE_SIZE);
  const pivot = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  };

  const distanceMin = Math.max(TILE_SIZE * 2.5, span * 0.9);
  const distanceMax = Math.max(distanceMin + TILE_SIZE * 2, span * 3.5 + spanY * 1.5);
  const defaultDistance = Math.min(
    distanceMax,
    Math.max(distanceMin, Math.hypot(span * 1.35, spanY + TILE_SIZE * 4)),
  );

  return { pivot, distanceMin, distanceMax, defaultDistance };
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
