import type { Board } from './board';
import { getFloor, listLegalStairLandings } from './board';
import type { Rng } from './dice';
import type { HoldState } from './hold';
import { cellAt, isOffPathCell } from './layout';
import { inferShape } from './shape';
import { layoutNeighbors } from './shape-layout';
import type { Cell, Floor, TokenPos } from './types';

export function sortedCells(floor: { cells: Cell[] }): Cell[] {
  return [...floor.cells].sort((a, b) => a.index - b.index);
}

export function walkableCells(floor: { cells: Cell[] }): Cell[] {
  return sortedCells(floor).filter((cell) => !isOffPathCell(cell));
}

function pathCells(floor: { cells: Cell[]; shape?: Floor['shape'] }): Cell[] {
  if (usesGraph(floor)) return sortedCells(floor);
  return walkableCells(floor);
}

function usesGraph(floor: { cells: Cell[]; shape?: Floor['shape'] }): boolean {
  const kind = inferShape(floor as Floor).kind;
  return kind === 'hub-spoke' || kind === 'hub-spoke-wheel';
}

function graphLinks(floor: { cells: Cell[]; shape?: Floor['shape'] }) {
  return layoutNeighbors(floor as Floor);
}

function nextOnGraph(
  links: Map<string, { nextId?: string; prevId?: string; branchId?: string }>,
  cellsById: Map<string, Cell>,
  currentId: string,
  prevId?: string,
): string | undefined {
  const current = links.get(currentId);
  if (!current) return undefined;
  if (current.branchId && (prevId === undefined || current.prevId === prevId)) {
    return current.branchId;
  }
  if (prevId === current.branchId) {
    return current.nextId;
  }
  if (!current.nextId) {
    const prior = current.prevId ? links.get(current.prevId) : undefined;
    const priorCell = prior?.prevId ? cellsById.get(prior.prevId) : undefined;
    if (prior?.prevId && priorCell?.region === 'hub') {
      return prior.prevId;
    }
    return current.prevId;
  }
  if (current.prevId && prevId === current.nextId) {
    return current.prevId;
  }
  return current.nextId;
}

export function walkSteps(
  floor: { cells: Cell[]; shape?: Floor['shape'] },
  fromCellId: string,
  steps: number,
): Cell | null {
  const cells = pathCells(floor);
  if (cells.length === 0) return null;
  if (steps === 0) return cells.find((c) => c.id === fromCellId) ?? null;

  if (!usesGraph(floor)) {
    const start = cells.findIndex((c) => c.id === fromCellId);
    if (start < 0) return null;
    const n = cells.length;
    const idx = ((start + steps) % n + n) % n;
    return cells[idx] ?? null;
  }

  const links = graphLinks(floor);
  const cellsById = new Map(cells.map((c) => [c.id, c]));
  let currentId = fromCellId;
  let prevId: string | undefined;
  for (let i = 0; i < steps; i += 1) {
    const nextId = nextOnGraph(links, cellsById, currentId, prevId);
    if (!nextId) return null;
    prevId = currentId;
    currentId = nextId;
  }
  return cells.find((c) => c.id === currentId) ?? null;
}

export function forwardPathCells(
  floor: { cells: Cell[]; shape?: Floor['shape'] },
  fromCellId: string,
  toCellId: string,
): Cell[] {
  const cells = pathCells(floor);
  const start = cells.findIndex((c) => c.id === fromCellId);
  const end = cells.findIndex((c) => c.id === toCellId);
  if (start < 0 || end < 0 || start === end) return [];

  if (!usesGraph(floor)) {
    const path: Cell[] = [];
    let i = start;
    do {
      i = (i + 1) % cells.length;
      const cell = cells[i];
      if (cell) path.push(cell);
    } while (i !== end);
    return path;
  }

  const links = graphLinks(floor);
  const cellsById = new Map(cells.map((c) => [c.id, c]));
  const path: Cell[] = [];
  let currentId = fromCellId;
  let prevId: string | undefined;
  const cap = cells.length * 4;
  for (let step = 0; step < cap; step += 1) {
    const nextId = nextOnGraph(links, cellsById, currentId, prevId);
    if (!nextId) break;
    prevId = currentId;
    currentId = nextId;
    const cell = cells.find((c) => c.id === currentId);
    if (!cell) break;
    path.push(cell);
    if (currentId === toCellId) break;
  }
  return path;
}

export function forwardPathSteps(
  floor: { cells: Cell[]; shape?: Floor['shape'] },
  fromCellId: string,
  steps: number,
): Cell[] {
  const cells = pathCells(floor);
  const start = cells.findIndex((c) => c.id === fromCellId);
  if (start < 0 || steps <= 0) return [];

  if (!usesGraph(floor)) {
    const path: Cell[] = [];
    let i = start;
    for (let step = 0; step < steps; step += 1) {
      i = (i + 1) % cells.length;
      const cell = cells[i];
      if (cell) path.push(cell);
    }
    return path;
  }

  const links = graphLinks(floor);
  const cellsById = new Map(cells.map((c) => [c.id, c]));
  const path: Cell[] = [];
  let currentId = fromCellId;
  let prevId: string | undefined;
  for (let step = 0; step < steps; step += 1) {
    const nextId = nextOnGraph(links, cellsById, currentId, prevId);
    if (!nextId) break;
    prevId = currentId;
    currentId = nextId;
    const cell = cells.find((c) => c.id === currentId);
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
  maxSteps: number,
  hold: HoldState | null,
  holdEnabled: boolean,
  minSteps = 1,
): number[] {
  const floor = getFloor(board, from.floorId);
  if (!floor || maxSteps < minSteps) return [];
  const allowed: number[] = [];
  for (let value = minSteps; value <= maxSteps; value += 1) {
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

export function clockwiseNext(floor: { cells: Cell[]; shape?: Floor['shape'] }, cellId: string): Cell | undefined {
  return walkSteps(floor, cellId, 1) ?? undefined;
}

export function rightNeighbor(floor: Floor, cell: Cell): Cell | undefined {
  const next = clockwiseNext(floor, cell.id);
  if (!next || cell.col === undefined || cell.row === undefined || next.col === undefined || next.row === undefined) {
    return undefined;
  }
  const dc = next.col - cell.col;
  const dr = next.row - cell.row;
  return cellAt(floor, cell.col - dr, cell.row + dc);
}

export function isChangeDirectionLegal(floor: Floor, cell: Cell): boolean {
  return Boolean(clockwiseNext(floor, cell.id) && rightNeighbor(floor, cell));
}

export function walkRightDetour(floor: Floor, cell: Cell, steps: number): Cell {
  if (steps <= 0) return cell;
  const first = rightNeighbor(floor, cell);
  if (!first) return cell;
  if (
    steps === 1
    || cell.col === undefined
    || cell.row === undefined
    || first.col === undefined
    || first.row === undefined
  ) {
    return first;
  }
  const dc = first.col - cell.col;
  const dr = first.row - cell.row;
  let current = first;
  for (let i = 1; i < steps; i += 1) {
    if (current.col === undefined || current.row === undefined) break;
    const next = cellAt(floor, current.col + dc, current.row + dr);
    if (!next || next.kind === 'hud' || next.kind === 'board') break;
    current = next;
  }
  return current;
}

export function sampleStairLanding(board: Board, fromFloorId: string, rng: Rng) {
  const legal = listLegalStairLandings(board, fromFloorId);
  if (legal.length === 0) return null;
  const idx = Math.floor(rng() * legal.length);
  return legal[idx] ?? null;
}
