import { createBoard, type Board } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { inferShape } from '@/lib/engine/shape';
import type { Cell, Floor } from '@/lib/engine/types';
import { dropRoomsOnFloor } from '@/lib/designer/rooms';

function posKey(cell: Pick<Cell, 'col' | 'row'>): string | null {
  if (cell.col === undefined || cell.row === undefined) return null;
  return `${cell.col},${cell.row}`;
}

function isConfiguredCell(cell: Cell): boolean {
  const extra = cell as Cell & { spinnerId?: string; roomId?: string };
  return Boolean(
    extra.start ||
      extra.end ||
      extra.packId ||
      extra.spinnerId ||
      extra.audio ||
      extra.image ||
      extra.video ||
      extra.face ||
      extra.hudWidget ||
      extra.stairId ||
      extra.roomId ||
      extra.kind === 'stair' ||
      extra.kind === 'room',
  );
}

export { isVanillaRoom, resetRoom } from '@/lib/designer/rooms';

export function isVanillaFloor(floor: Floor): boolean {
  if (floor.holdEnabled) return false;
  if (floor.look?.image || floor.look?.surround?.image || floor.look?.centreMesh?.kind === 'castle') {
    return false;
  }
  const template = createLoopedFloor(floor.id, floor.label, floor.index, floor.shape ?? inferShape(floor));
  if (floor.cells.length !== template.cells.length) return false;
  const templateByPos = new Map<string, Cell>();
  for (const cell of template.cells) {
    const key = posKey(cell);
    if (!key) return false;
    templateByPos.set(key, cell);
  }
  const seen = new Set<string>();
  for (const cell of floor.cells) {
    const key = posKey(cell);
    if (!key) return false;
    const expected = templateByPos.get(key);
    if (!expected || expected.kind !== cell.kind) return false;
    if (isConfiguredCell(cell)) return false;
    seen.add(key);
  }
  return seen.size === templateByPos.size;
}

export function resetFloor(board: Board, floorId: string): Board {
  const floor = board.floors.find((entry) => entry.id === floorId);
  if (!floor) return board;
  const next = createLoopedFloor(floor.id, floor.label, floor.index, floor.shape ?? inferShape(floor));
  return createBoard(
    board.floors.map((entry) => (entry.id === floorId ? next : entry)),
    board.stairs.filter((stair) => stair.fromFloorId !== floorId),
    dropRoomsOnFloor(board, floorId),
  );
}
