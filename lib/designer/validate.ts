import type { Board } from '@/lib/engine/board';
import { orderCellsAlongLoop, loopCells, defaultHudFill } from '@/lib/engine/layout';
import { roomHasWalkableInterior } from '@/lib/designer/rooms';
import { inferShape } from '@/lib/engine/shape';
import {
  buildShapeLayout,
  isRegionLoop,
  isSpokePath,
  layoutNeighbors,
} from '@/lib/engine/shape-layout';
import type { Cell } from '@/lib/engine/types';

export type LayoutIssueCode =
  | 'empty-floor'
  | 'non-loop'
  | 'broken-spoke'
  | 'dangling-stair'
  | 'pack-on-stair'
  | 'missing-start'
  | 'missing-hud'
  | 'room-without-interior'
  | 'missing-room-door';

export interface LayoutIssue {
  code: LayoutIssueCode;
  message: string;
  floorId?: string;
  cellId?: string;
  stairId?: string;
}

function orderCellsAlongTopology(floor: { cells: Cell[]; shape?: Board['floors'][0]['shape'] }): Cell[] | null {
  const shape = inferShape(floor);
  const layout = buildShapeLayout(shape);
  const ringCells = loopCells(floor)
    .filter((c) => c.region === 'ring' || (!c.region && shape.kind === 'circle'))
    .sort((a, b) => (a.slot ?? a.index) - (b.slot ?? b.index));
  if (ringCells.length < 4) return ringCells.length === 0 ? [] : null;
  const neighbors = layoutNeighbors(floor);
  const start = ringCells.find((c) => c.start) ?? ringCells[0];
  if (!start) return null;
  const ordered: Cell[] = [start];
  let current = start;
  const visited = new Set<string>([start.id]);
  while (ordered.length < ringCells.length) {
    const links = neighbors.get(current.id);
    if (!links?.nextId || visited.has(links.nextId)) return null;
    const next = ringCells.find((c) => c.id === links.nextId);
    if (!next) return null;
    ordered.push(next);
    visited.add(next.id);
    current = next;
  }
  const lastLinks = neighbors.get(current.id);
  if (lastLinks?.nextId !== start.id) return null;
  return ordered.map((cell, index) => ({ ...cell, index }));
}

function validateFloorLoop(floor: Board['floors'][0]): LayoutIssue | null {
  const shape = inferShape(floor);
  if (shape.kind === 'square' || shape.kind === 'rectangle') {
    if (!orderCellsAlongLoop(loopCells(floor))) {
      return {
        code: 'non-loop',
        message: `${floor.label} must be a looping corridor.`,
        floorId: floor.id,
      };
    }
    return null;
  }
  if (shape.kind === 'circle') {
    const ringCells = floor.cells.filter((c) => c.region === 'ring');
    const layout = buildShapeLayout(shape);
    if (ringCells.length !== layout.slots.length) {
      return {
        code: 'non-loop',
        message: `${floor.label} must be a looping corridor.`,
        floorId: floor.id,
      };
    }
    if (!orderCellsAlongTopology(floor)) {
      return {
        code: 'non-loop',
        message: `${floor.label} must be a looping corridor.`,
        floorId: floor.id,
      };
    }
    return null;
  }
  const neighbors = layoutNeighbors(floor);
  const hubCells = floor.cells.filter((c) => c.region === 'hub');
  const wheelCells = floor.cells.filter((c) => c.region === 'wheel');
  const spokeGroups = new Map<number, Cell[]>();
  for (const cell of floor.cells.filter((c) => c.region === 'spoke')) {
    const idx = cell.spokeIndex ?? 0;
    const group = spokeGroups.get(idx) ?? [];
    group.push(cell);
    spokeGroups.set(idx, group);
  }
  if (hubCells.length > 0 && !isRegionLoop(neighbors, hubCells.map((c) => c.id))) {
    return {
      code: 'non-loop',
      message: `${floor.label} must be a looping corridor.`,
      floorId: floor.id,
    };
  }
  if (wheelCells.length > 0 && !isRegionLoop(neighbors, wheelCells.map((c) => c.id))) {
    return {
      code: 'non-loop',
      message: `${floor.label} must be a looping corridor.`,
      floorId: floor.id,
    };
  }
  const requiresWheel = shape.kind === 'hub-spoke-wheel';
  for (const [spokeIndex, cells] of spokeGroups) {
    if (!isSpokePath(neighbors, cells, requiresWheel)) {
      return {
        code: 'broken-spoke',
        message: `${floor.label}: spoke ${spokeIndex + 1} is not a connected path.`,
        floorId: floor.id,
      };
    }
  }
  return null;
}

function floorExpectsHudTiles(floor: Board['floors'][0]): boolean {
  const shape = inferShape(floor);
  if (shape.kind !== 'square' && shape.kind !== 'rectangle') return false;
  return defaultHudFill(buildShapeLayout(shape)).length > 0;
}

export function validateLayout(board: Board): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const hasStart = board.floors.some((floor) => floor.cells.some((cell) => cell.start));
  if (!hasStart) {
    issues.push({ code: 'missing-start', message: 'Mark a start tile.' });
  }
  const hasHud = board.floors.some((floor) => floor.cells.some((cell) => cell.kind === 'hud'));
  if (board.floors.some(floorExpectsHudTiles) && !hasHud) {
    issues.push({ code: 'missing-hud', message: 'Place at least one HUD tile.' });
  }

  for (const floor of board.floors) {
    if (floor.cells.length === 0) {
      issues.push({
        code: 'empty-floor',
        message: `${floor.label} has no squares.`,
        floorId: floor.id,
      });
      continue;
    }
    const loopIssue = validateFloorLoop(floor);
    if (loopIssue) issues.push(loopIssue);
    for (const cell of floor.cells) {
      if (cell.kind === 'stair') {
        const stair = board.stairs.find((s) => s.id === cell.stairId);
        const destOk = Boolean(
          stair &&
            stair.legal &&
            board.floors.some(
              (f) => f.id === stair.toFloorId && f.cells.some((c) => c.id === stair.toCellId),
            ),
        );
        if (!destOk) {
          issues.push({
            code: 'dangling-stair',
            message: `${floor.label}: stair has no destination.`,
            floorId: floor.id,
            cellId: cell.id,
            stairId: cell.stairId,
          });
        }
        if (cell.packId) {
          issues.push({
            code: 'pack-on-stair',
            message: `${floor.label}: stair squares cannot hold a pack.`,
            floorId: floor.id,
            cellId: cell.id,
          });
        }
      }
    }
  }

  for (const room of board.rooms ?? []) {
    if (room.mode === 'multi' && !roomHasWalkableInterior(room)) {
      issues.push({
        code: 'room-without-interior',
        message: `${room.name}: multi-tile room has no walkable interior.`,
      });
    }
    if (room.mode === 'multi' && !(room.cells ?? []).some((cell) => cell.kind === 'door')) {
      issues.push({
        code: 'missing-room-door',
        message: `${room.name}: multi-tile room needs a Door.`,
      });
    }
  }

  return issues;
}

export function canTestPlay(board: Board): boolean {
  return validateLayout(board).length === 0;
}

export function canPublishPlay(board: Board): boolean {
  return canTestPlay(board);
}
