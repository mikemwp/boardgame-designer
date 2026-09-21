'use client';

import { FloorPreview } from '@/components/board/FloorPreview';
import { CellInspector } from '@/components/designer/CellInspector';
import { DesignerPalette, type DesignerTool } from '@/components/designer/DesignerPalette';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { ValidationList } from '@/components/designer/ValidationList';
import {
  addFloor,
  attachStair,
  clearStair,
  deleteFloor,
  eraseCell,
  linkStair,
  moveCell,
  nextCellId,
  nextFloorId,
  placeCorridor,
  renameFloor,
  setCellPack,
  setStartCell,
} from '@/lib/designer/mutate';
import type { LayoutIssue } from '@/lib/designer/validate';
import type { Board } from '@/lib/engine/board';
import { cellAt, listPackIds } from '@/lib/engine/layout';

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
  if (!floor) return <p className="text-slate-400">This draft has no floors.</p>;

  const activate = (col: number, row: number) => {
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
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-3">
        <FloorTabs
          floors={board.floors}
          selectedFloorId={floor.id}
          onSelect={(id) => {
            onSelectFloor(id);
            onSelectCell(null);
          }}
          onAdd={() => {
            const id = nextFloorId(board);
            const next = addFloor(board, id, `Floor ${board.floors.length + 1}`);
            onBoardChange(next);
            onSelectFloor(id);
            onSelectCell(null);
          }}
          onDelete={(id) => {
            const next = deleteFloor(board, id);
            onBoardChange(next);
            onSelectFloor(next.floors[0]?.id ?? id);
            onSelectCell(null);
          }}
        />
        <DesignerPalette tool={tool} onToolChange={onToolChange} />
        <LayoutGrid
          floor={floor}
          selectedCellId={selectedCellId ?? undefined}
          onSlotActivate={activate}
          onMoveCell={(cellId, col, row) => onBoardChange(moveCell(board, floor.id, cellId, col, row))}
        />
        <ValidationList issues={issues} />
      </div>
      <aside className="flex flex-col gap-3">
        <CellInspector
          board={board}
          floorId={floor.id}
          cellId={selectedCellId}
          packIds={listPackIds(cards)}
          onRenameFloor={(label) => onBoardChange(renameFloor(board, floor.id, label))}
          onSetPack={(packId) => {
            if (!selectedCellId) return;
            onBoardChange(setCellPack(board, floor.id, selectedCellId, packId));
          }}
          onSetStart={() => {
            if (!selectedCellId) return;
            onBoardChange(setStartCell(board, floor.id, selectedCellId));
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
        <FloorPreview board={board} floorId={floor.id} selectedCellId={selectedCellId ?? undefined} />
      </aside>
    </div>
  );
}
