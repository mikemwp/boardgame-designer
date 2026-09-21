import type { Board } from './board';
import { getFloor, listLegalStairLandings } from './board';
import type { Rng } from './dice';
import type { HoldState } from './hold';
import type { Cell, TokenPos } from './types';

export function sortedCells(floor: { cells: Cell[] }): Cell[] {
  return [...floor.cells].sort((a, b) => a.index - b.index);
}

export function walkSteps(floor: { cells: Cell[] }, fromCellId: string, steps: number): Cell | null {
  const cells = sortedCells(floor);
  if (cells.length === 0) return null;
  const start = cells.findIndex((c) => c.id === fromCellId);
  if (start < 0) return null;
  const n = cells.length;
  const idx = ((start + steps) % n + n) % n;
  return cells[idx] ?? null;
}

export function forwardPathCells(floor: { cells: Cell[] }, fromCellId: string, toCellId: string): Cell[] {
  const cells = sortedCells(floor);
  const start = cells.findIndex((c) => c.id === fromCellId);
  const end = cells.findIndex((c) => c.id === toCellId);
  if (start < 0 || end < 0 || start === end) return [];
  const path: Cell[] = [];
  let i = start;
  do {
    i = (i + 1) % cells.length;
    const cell = cells[i];
    if (cell) path.push(cell);
  } while (i !== end);
  return path;
}

export function forwardPathSteps(floor: { cells: Cell[] }, fromCellId: string, steps: number): Cell[] {
  const cells = sortedCells(floor);
  const start = cells.findIndex((c) => c.id === fromCellId);
  if (start < 0 || steps <= 0) return [];
  const path: Cell[] = [];
  let i = start;
  for (let step = 0; step < steps; step += 1) {
    i = (i + 1) % cells.length;
    const cell = cells[i];
    if (cell) path.push(cell);
  }
  return path;
}

export function isIllegalLanding(
  board: Board,
  cell: Cell,
  fromFloorId: string,
  hold: HoldState | null,
  holdEnabled: boolean,
): boolean {
  if (cell.kind !== 'stair' || !cell.stairId) return false;
  const stair = board.stairs.find((s) => s.id === cell.stairId);
  if (!stair) return false;
  if (!stair.legal) return true;
  const exitsFloor = stair.toFloorId !== fromFloorId;
  return Boolean(
    exitsFloor && holdEnabled && hold?.active && hold.floorId === fromFloorId,
  );
}

export function allowedMoveValues(
  board: Board,
  from: TokenPos,
  sides: number,
  hold: HoldState | null,
  holdEnabled: boolean,
): number[] {
  const floor = getFloor(board, from.floorId);
  if (!floor || sides < 1) return [];
  const allowed: number[] = [];
  for (let value = 1; value <= sides; value += 1) {
    const landing = walkSteps(floor, from.cellId, value);
    if (!landing) continue;
    if (!isIllegalLanding(board, landing, from.floorId, hold, holdEnabled)) {
      allowed.push(value);
    }
  }
  return allowed;
}

export function sampleMoveValue(allowed: number[], rng: Rng): number {
  if (allowed.length === 0) return 0;
  const idx = Math.floor(rng() * allowed.length);
  return allowed[idx] ?? 0;
}

export function sampleStairLanding(board: Board, fromFloorId: string, rng: Rng) {
  const legal = listLegalStairLandings(board, fromFloorId);
  if (legal.length === 0) return null;
  const idx = Math.floor(rng() * legal.length);
  return legal[idx] ?? null;
}
