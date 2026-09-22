'use client';

import { FloorPreview } from '@/components/board/FloorPreview';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';
import { CellInspector } from '@/components/designer/CellInspector';
import { DesignerPalette, type DesignerTool } from '@/components/designer/DesignerPalette';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { ValidationList } from '@/components/designer/ValidationList';
import {
  addFloor,
  applyFloorShape,
  attachStair,
  clearStair,
  deleteFloor,
  eraseCell,
  linkStair,
  moveCell,
  moveCellToSlot,
  nextCellId,
  nextFloorId,
  nextLevelLabel,
  placeCorridor,
  placeCorridorOnSlot,
  placeHud,
  renameFloor,
  setCellPack,
  setEndCell,
  setStartCell,
} from '@/lib/designer/mutate';
import type { LayoutIssue } from '@/lib/designer/validate';
import type { Board } from '@/lib/engine/board';
import { cellAt, listPackIds } from '@/lib/engine/layout';
import { normalizeShape } from '@/lib/engine/shape';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { inferShape } from '@/lib/engine/shape';

export function LayoutDesigner({
  board,
  cards,
  selectedFloorId,
  selectedCellId,
  tool,
  issues,
  onBoardChange,
  onSelectFloor,
  onSelectCell,
  onToolChange,
}: {
  board: Board;
  cards: Array<{ pack: string }>;
  selectedFloorId: string;
  selectedCellId: string | null;
  tool: DesignerTool;
  issues: LayoutIssue[];
  onBoardChange: (board: Board) => void;
  onSelectFloor: (id: string) => void;
  onSelectCell: (id: string | null) => void;
  onToolChange: (tool: DesignerTool) => void;
}) {
  const floor = board.floors.find((f) => f.id === selectedFloorId) ?? board.floors[0];
  if (!floor) return <p className="text-slate-400">This draft has no levels.</p>;

  const shapeKind = inferShape(floor).kind;
  const isPolar = shapeKind === 'circle' || shapeKind === 'hub-spoke' || shapeKind === 'hub-spoke-wheel';

  const activateCartesian = (col: number, row: number) => {
    const existing = cellAt(floor, col, row);
    if (tool === 'erase') {
      if (existing) {
        onBoardChange(eraseCell(board, floor.id, existing.id));
        onSelectCell(null);
      }
      return;
    }
    if (tool === 'corridor') {
      if (existing) {
        onSelectCell(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeCorridor(board, floor.id, col, row, id));
      onSelectCell(id);
      return;
    }
    if (tool === 'hud') {
      if (existing) {
        onSelectCell(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeHud(board, floor.id, col, row, id));
      onSelectCell(id);
      return;
    }
    if (tool === 'stair') {
      if (!existing) return;
      if (existing.kind === 'stair') {
        onSelectCell(existing.id);
        return;
      }
      onBoardChange(attachStair(board, floor.id, existing.id));
      onSelectCell(existing.id);
      return;
    }
    onSelectCell(existing?.id ?? null);
  };

  const activatePolar = (slotId: string) => {
    const layout = buildShapeLayout(floor.shape!);
    const slot = layout.slots.find((s) => s.id === slotId);
    if (!slot) return;
    const existing = floor.cells.find(
      (c) =>
        c.region === slot.region &&
        (c.spokeIndex ?? -1) === (slot.spokeIndex ?? -1) &&
        c.slot === slot.slot,
    );
    if (tool === 'erase') {
      if (existing) {
        onBoardChange(eraseCell(board, floor.id, existing.id));
        onSelectCell(null);
      }
      return;
    }
    if (tool === 'corridor') {
      if (existing) {
        onSelectCell(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeCorridorOnSlot(board, floor.id, slotId, id));
      onSelectCell(id);
      return;
    }
    if (tool === 'stair') {
      if (!existing) return;
      if (existing.kind === 'stair') {
        onSelectCell(existing.id);
        return;
      }
      onBoardChange(attachStair(board, floor.id, existing.id));
      onSelectCell(existing.id);
      return;
    }
    onSelectCell(existing?.id ?? null);
  };

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[3fr_2fr]">
      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
        <div
          className="flex min-w-0 flex-nowrap items-end gap-2 overflow-x-auto"
          data-testid="designer-toolbar"
        >
          <FloorTabs
            floors={board.floors}
            selectedFloorId={floor.id}
            onSelect={(id) => {
              onSelectFloor(id);
              onSelectCell(null);
            }}
            onAdd={() => {
              const id = nextFloorId(board);
              const next = addFloor(board, id, nextLevelLabel(board.floors), floor.shape);
              onBoardChange(next);
              onSelectFloor(id);
              onSelectCell(null);
            }}
            onDelete={(id) => {
              const idx = board.floors.findIndex((f) => f.id === id);
              const next = deleteFloor(board, id);
              const pick = next.floors[Math.min(idx, next.floors.length - 1)] ?? next.floors[0];
              onBoardChange(next);
              onSelectFloor(pick?.id ?? id);
              onSelectCell(null);
            }}
            onRename={(label) => onBoardChange(renameFloor(board, floor.id, label))}
          />
          <BoardShapeFields
            shape={normalizeShape(floor.shape)}
            onChange={(shape) => onBoardChange(applyFloorShape(board, floor.id, shape))}
          />
          <DesignerPalette tool={tool} onToolChange={onToolChange} className="ml-auto shrink-0 justify-end" />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <LayoutGrid
            floor={floor}
            selectedCellId={selectedCellId ?? undefined}
            onSlotActivate={activateCartesian}
            onMoveCell={(cellId, col, row) => onBoardChange(moveCell(board, floor.id, cellId, col, row))}
            onSlotActivateId={isPolar ? activatePolar : undefined}
            onMoveCellToSlot={
              isPolar
                ? (cellId, slotId) => onBoardChange(moveCellToSlot(board, floor.id, cellId, slotId))
                : undefined
            }
          />
        </div>
        <ValidationList issues={issues} />
      </div>
      <aside className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
        <div className="h-64 max-h-[40%] shrink-0 overflow-y-auto" data-testid="tile-actions-pane">
          <CellInspector
            board={board}
            floorId={floor.id}
            cellId={selectedCellId}
            packIds={listPackIds(cards)}
            onSetPack={(packId) => {
              if (!selectedCellId) return;
              onBoardChange(setCellPack(board, floor.id, selectedCellId, packId));
            }}
            onSetStart={() => {
              if (!selectedCellId) return;
              onBoardChange(setStartCell(board, floor.id, selectedCellId));
            }}
            onSetEnd={() => {
              if (!selectedCellId) return;
              onBoardChange(setEndCell(board, floor.id, selectedCellId));
            }}
            onAttachStair={() => {
              if (!selectedCellId) return;
              onBoardChange(attachStair(board, floor.id, selectedCellId));
            }}
            onLinkStair={(toFloorId, toCellId) => {
              const cell = floor.cells.find((c) => c.id === selectedCellId);
              if (!cell?.stairId) return;
              onBoardChange(linkStair(board, cell.stairId, toFloorId, toCellId));
            }}
            onClearStair={() => {
              if (!selectedCellId) return;
              onBoardChange(clearStair(board, floor.id, selectedCellId));
            }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden" data-testid="preview-pane">
          <FloorPreview board={board} floorId={floor.id} selectedCellId={selectedCellId ?? undefined} />
        </div>
      </aside>
    </div>
  );
}
