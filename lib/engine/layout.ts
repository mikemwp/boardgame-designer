import { createBoard, type Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { DEFAULT_SHAPE, inferShape, normalizeShape } from '@/lib/engine/shape';
import type { BoardShape, Cell, Floor, HudRect } from '@/lib/engine/types';

export const DEFAULT_COLUMNS = 8;
export const DEFAULT_ROWS = 7;
export const DEFAULT_HUD: HudRect = { col: 2, row: 2, width: 4, height: 2 };

/** Tiles along each edge of the square ring (4*n - 4 corridor cells total). */
export function squareRingTilesPerSide(cellCount: number): number {
  return Math.max(2, Math.ceil((cellCount + 4) / 4));
}

export function squareRingCellCount(tilesPerSide: number): number {
  return 4 * tilesPerSide - 4;
}

export function defaultLoopPositions(
  cellCount = 8,
  _hud: HudRect = DEFAULT_HUD,
): Array<{ col: number; row: number }> {
  const tilesPerSide = squareRingTilesPerSide(cellCount);
  const layout = buildShapeLayout({ kind: 'square', tilesPerSide });
  const positions = layout.slots.map((s) => ({ col: s.col!, row: s.row! }));
  const expected = squareRingCellCount(tilesPerSide);
  if (cellCount === expected) return positions;
  return positions.slice(0, cellCount);
}

function isPolarShape(floor: Floor): boolean {
  const kind = floor.shape?.kind ?? inferShape(floor).kind;
  return kind === 'circle' || kind === 'hub-spoke' || kind === 'hub-spoke-wheel';
}

export function isHudSlot(floor: Floor, col: number, row: number): boolean {
  if (isPolarShape(floor)) return false;
  const hud = floor.hud ?? DEFAULT_HUD;
  return (
    col >= hud.col &&
    col < hud.col + hud.width &&
    row >= hud.row &&
    row < hud.row + hud.height
  );
}

export function inBounds(floor: Floor, col: number, row: number): boolean {
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  return col >= 0 && row >= 0 && col < columns && row < rows;
}

export function createLoopedFloor(
  id: string,
  label: string,
  index: number,
  shapeInput?: BoardShape,
): Floor {
  const shape = normalizeShape(shapeInput);
  const layout = buildShapeLayout(shape);
  const cells: Cell[] = layout.slots.map((slot, i) => ({
    id: `${id}-c${i}`,
    index: i,
    kind: 'corridor',
    col: slot.col,
    row: slot.row,
    region: slot.region,
    spokeIndex: slot.spokeIndex,
    slot: slot.slot,
  }));
  return {
    id,
    index,
    label,
    holdEnabled: false,
    cells,
    columns: layout.columns,
    rows: layout.rows,
    hud: { ...layout.hud },
    shape,
  };
}

export function cellAt(floor: Floor, col: number, row: number): Cell | undefined {
  return floor.cells.find((cell) => cell.col === col && cell.row === row);
}

export function areAdjacent(
  a: { col?: number; row?: number },
  b: { col?: number; row?: number },
): boolean {
  if (a.col === undefined || a.row === undefined || b.col === undefined || b.row === undefined) {
    return false;
  }
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}

function neighborsOf(cells: Cell[], cell: Cell): Cell[] {
  return cells.filter((other) => other.id !== cell.id && areAdjacent(cell, other));
}

export function orderCellsAlongLoop(cells: Cell[]): Cell[] | null {
  if (cells.length < 4) return null;
  const start = cells.find((cell) => cell.start) ?? cells[0];
  if (!start) return null;
  const startNeighbors = neighborsOf(cells, start).sort((a, b) => a.index - b.index);
  const first = startNeighbors[0];
  if (!first) return null;
  const ordered: Cell[] = [start];
  let prev = start;
  let current = first;
  while (ordered.length < cells.length) {
    ordered.push(current);
    if (ordered.length === cells.length) break;
    const visited = new Set(ordered.map((cell) => cell.id));
    const next = neighborsOf(cells, current)
      .filter((n) => n.id !== prev.id && !visited.has(n.id))
      .sort((a, b) => a.index - b.index)[0];
    if (!next) return null;
    prev = current;
    current = next;
  }
  const last = ordered[ordered.length - 1];
  if (!last || ordered.length !== cells.length || !areAdjacent(last, start)) return null;
  return ordered.map((cell, index) => ({ ...cell, index }));
}

export function retileFloor(floor: Floor): Floor {
  const ordered = orderCellsAlongLoop(floor.cells);
  return ordered ? { ...floor, cells: ordered } : floor;
}

export function ensureFloorLayout(floor: Floor): Floor {
  const shape = inferShape(floor);
  const layout = buildShapeLayout(shape);
  const cells = floor.cells.map((cell, i) => {
    const slot = layout.slots[i];
    return {
      ...cell,
      col: cell.col ?? slot?.col,
      row: cell.row ?? slot?.row,
      region: cell.region ?? slot?.region,
      spokeIndex: cell.spokeIndex ?? slot?.spokeIndex,
      slot: cell.slot ?? slot?.slot,
    };
  });
  return retileFloor({
    ...floor,
    shape: floor.shape ?? shape,
    columns: floor.columns ?? layout.columns,
    rows: floor.rows ?? layout.rows,
    hud: floor.hud ?? { ...layout.hud },
    cells,
  });
}

export function ensureBoardLayout(board: Board): Board {
  const floors = board.floors.map((floor) => ensureFloorLayout(floor));
  return createBoard(floors, board.stairs);
}

export function startToken(board: Board): { floorId: string; cellId: string } | undefined {
  for (const floor of board.floors) {
    const cell = floor.cells.find((c) => c.start);
    if (cell) return { floorId: floor.id, cellId: cell.id };
  }
  const floor = board.floors[0];
  const cell = floor?.cells[0];
  if (!floor || !cell) return undefined;
  return { floorId: floor.id, cellId: cell.id };
}

export function applyStartToPlayers(players: PlayerState, board: Board): PlayerState {
  const token = startToken(board);
  if (!token) return players;
  return {
    ...players,
    players: players.players.map((player) => ({ ...player, token })),
  };
}

export function stairDirection(
  board: Board,
  fromFloorId: string,
  toFloorId: string,
): 'up' | 'down' | 'same' {
  const from = board.floors.find((f) => f.id === fromFloorId)?.index ?? 0;
  const to = board.floors.find((f) => f.id === toFloorId)?.index ?? 0;
  if (to > from) return 'up';
  if (to < from) return 'down';
  return 'same';
}

export function stairLabel(
  board: Board,
  stair: { fromFloorId: string; toFloorId: string },
): string {
  const dest = board.floors.find((f) => f.id === stair.toFloorId);
  const name = dest?.label ?? 'Unknown';
  const dir = stairDirection(board, stair.fromFloorId, stair.toFloorId);
  if (dir === 'up') return `Up to ${name}`;
  if (dir === 'down') return `Down to ${name}`;
  return `To ${name}`;
}

export function previewBoardForFloor(board: Board, floorId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor) return createBoard([], []);
  return createBoard(
    [{ ...floor, index: 0 }],
    board.stairs.filter((s) => s.fromFloorId === floorId),
  );
}

export function listPackIds(cards: Array<{ pack: string }>): string[] {
  return [...new Set(cards.map((card) => card.pack))].sort();
}
