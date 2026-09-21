import { createBoard, type Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';
import type { Cell, Floor, HudRect } from '@/lib/engine/types';

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

function walkSquareRing(
  left: number,
  top: number,
  tilesPerSide: number,
): Array<{ col: number; row: number }> {
  const right = left + tilesPerSide - 1;
  const bottom = top + tilesPerSide - 1;
  const positions: Array<{ col: number; row: number }> = [];
  for (let col = left; col <= right; col += 1) positions.push({ col, row: top });
  for (let row = top + 1; row < bottom; row += 1) positions.push({ col: right, row });
  for (let col = right; col >= left; col -= 1) positions.push({ col, row: bottom });
  for (let row = bottom - 1; row > top; row -= 1) positions.push({ col: left, row });
  return positions;
}

export function squareRingPositions(
  hud: HudRect,
  tilesPerSide: number,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
): Array<{ col: number; row: number }> {
  if (tilesPerSide < 2) return [];
  const floor: Floor = { id: '', index: 0, label: '', cells: [], hud };
  const hudCenterCol = hud.col + hud.width / 2;
  const hudCenterRow = hud.row + hud.height / 2;

  let best: Array<{ col: number; row: number }> | null = null;
  let bestDistance = Infinity;

  for (let top = 0; top < rows; top += 1) {
    for (let left = 0; left < columns; left += 1) {
      const positions = walkSquareRing(left, top, tilesPerSide);
      const inBounds = positions.every(
        (pos) => pos.col >= 0 && pos.col < columns && pos.row >= 0 && pos.row < rows,
      );
      if (!inBounds) continue;
      if (!positions.every((pos) => !isHudSlot(floor, pos.col, pos.row))) continue;

      const ringCenterCol = left + (tilesPerSide - 1) / 2;
      const ringCenterRow = top + (tilesPerSide - 1) / 2;
      const distance =
        Math.abs(ringCenterCol - hudCenterCol) + Math.abs(ringCenterRow - hudCenterRow);
      if (distance < bestDistance) {
        best = positions;
        bestDistance = distance;
      }
    }
  }

  return best ?? walkSquareRing(0, 0, tilesPerSide);
}

export function defaultLoopPositions(
  cellCount = 8,
  hud: HudRect = DEFAULT_HUD,
): Array<{ col: number; row: number }> {
  const tilesPerSide = squareRingTilesPerSide(cellCount);
  const ring = squareRingPositions(hud, tilesPerSide);
  const expected = squareRingCellCount(tilesPerSide);
  if (cellCount === expected) return ring;
  return ring.slice(0, cellCount);
}

export function isHudSlot(floor: Floor, col: number, row: number): boolean {
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
  cellCount = 8,
): Floor {
  const positions = defaultLoopPositions(cellCount);
  const cells: Cell[] = positions.map((pos, i) => ({
    id: `${id}-c${i}`,
    index: i,
    kind: 'corridor',
    col: pos.col,
    row: pos.row,
    start: index === 0 && i === 0,
  }));
  return {
    id,
    index,
    label,
    holdEnabled: false,
    cells,
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    hud: { ...DEFAULT_HUD },
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
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  const hud = floor.hud ?? { ...DEFAULT_HUD };
  const positions = defaultLoopPositions(floor.cells.length, hud);
  const cells = floor.cells.map((cell, i) => ({
    ...cell,
    col: cell.col ?? positions[i]?.col ?? 0,
    row: cell.row ?? positions[i]?.row ?? 0,
  }));
  return retileFloor({ ...floor, columns, rows, hud, cells });
}

export function ensureBoardLayout(board: Board): Board {
  const floors = board.floors.map((floor) => ensureFloorLayout(floor));
  const hasStart = floors.some((floor) => floor.cells.some((cell) => cell.start));
  if (!hasStart && floors[0]?.cells[0]) {
    floors[0] = {
      ...floors[0],
      cells: floors[0].cells.map((cell, i) => (i === 0 ? { ...cell, start: true } : cell)),
    };
  }
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
