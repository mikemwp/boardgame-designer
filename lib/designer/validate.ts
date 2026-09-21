import type { Board } from '@/lib/engine/board';
import { orderCellsAlongLoop } from '@/lib/engine/layout';

export type LayoutIssueCode =
  | 'empty-floor'
  | 'non-loop'
  | 'dangling-stair'
  | 'pack-on-stair'
  | 'missing-start';

export interface LayoutIssue {
  code: LayoutIssueCode;
  message: string;
  floorId?: string;
  cellId?: string;
  stairId?: string;
}

export function validateLayout(board: Board): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const hasStart = board.floors.some((floor) => floor.cells.some((cell) => cell.start));
  if (!hasStart) {
    issues.push({ code: 'missing-start', message: 'Mark a start square.' });
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
    if (!orderCellsAlongLoop(floor.cells)) {
      issues.push({
        code: 'non-loop',
        message: `${floor.label} must be a looping corridor.`,
        floorId: floor.id,
      });
    }
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

  return issues;
}

export function canTestPlay(board: Board): boolean {
  return validateLayout(board).length === 0;
}
