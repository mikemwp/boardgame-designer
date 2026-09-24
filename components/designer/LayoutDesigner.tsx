'use client';

import { useState } from 'react';
import { FloorPreview } from '@/components/board/FloorPreview';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';
import { CellInspector } from '@/components/designer/CellInspector';
import { DesignerPalette, type DesignerTool } from '@/components/designer/DesignerPalette';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { HoldEditor } from '@/components/designer/HoldEditor';
import { LevelConfirmDialog } from '@/components/designer/LevelConfirmDialog';
import { PlayerEditor } from '@/components/designer/PlayerEditor';
import { SpinnerEditor } from '@/components/designer/SpinnerEditor';
import { isVanillaFloor, resetFloor } from '@/lib/designer/level-size';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { PackEditor } from '@/components/designer/PackEditor';
import { StartEditor } from '@/components/designer/StartEditor';
import { ValidationList } from '@/components/designer/ValidationList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  placeDoor,
  placeHud,
  placeRoom,
  clearCell,
  clearDoor,
  renameFloor,
  setCellAudio,
  setCellImage,
  setCellVideo,
  setCellPack,
  setCellSpinner,
  setEndCell,
  setFloorHold,
  setHudWidget,
  setStartCell,
} from '@/lib/designer/mutate';
import {
  addCard,
  createPack,
  deleteCard,
  deletePack,
  listDraftPackIds,
  nextCardId,
  nextPackId,
  renamePack,
  updateCard,
} from '@/lib/designer/packs';
import {
  addSegment,
  createSpinner,
  deleteSpinner,
  nextSpinnerId,
  removeSegment,
  renameSpinner,
  rewriteSpinnerRefs,
  setSegmentLabel,
  setSegmentPercent,
  setSplit,
  updateSpinner,
} from '@/lib/designer/spinners';
import { createItem, deleteItem, nextItemId, updateItem } from '@/lib/designer/items';
import type { LayoutIssue } from '@/lib/designer/validate';
import type { Board } from '@/lib/engine/board';
import { cellAt, listPackIds } from '@/lib/engine/layout';
import { normalizeShape } from '@/lib/engine/shape';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { inferShape } from '@/lib/engine/shape';
import { emptyGameStart } from '@/lib/engine/audio';
import type { Card, GameStart, ImageRef, InventoryItem, ItemAssign, SpinnerDef, VideoRef } from '@/lib/engine/types';
import type { GameStatus } from '@/lib/library/types';
import { memoryMediaStore, type MediaStore } from '@/lib/library/media-store';
import { formatDesignerLastSaved, formatDesignerStatus } from '@/lib/library/version';

export type DesignerSideTab = 'levels' | 'tiles' | 'packs' | 'spinners' | 'players' | 'start';

export type DesignerMetadata = {
  lastSaved?: string;
  status?: GameStatus;
  version?: string | null;
  savedLocation?: string;
};

export function LayoutDesigner({
  board,
  cards,
  packs,
  selectedFloorId,
  selectedCellId,
  tool,
  issues,
  onBoardChange,
  onDraftChange,
  onSelectFloor,
  onSelectCell,
  onToolChange,
  gameStart,
  onGameStartChange,
  spinners,
  items,
  itemAssign,
  onCatalogChange,
  gameId,
  media,
  metadata,
}: {
  board: Board;
  cards: Card[];
  packs?: string[];
  selectedFloorId: string;
  selectedCellId: string | null;
  tool: DesignerTool;
  issues: LayoutIssue[];
  onBoardChange: (board: Board) => void;
  onDraftChange?: (next: { cards: Card[]; packs: string[]; board: Board }) => void;
  onSelectFloor: (id: string) => void;
  onSelectCell: (id: string | null) => void;
  onToolChange: (tool: DesignerTool) => void;
  gameStart?: GameStart;
  onGameStartChange?: (start: GameStart) => void;
  spinners?: SpinnerDef[];
  items?: InventoryItem[];
  itemAssign?: ItemAssign;
  onCatalogChange?: (next: {
    spinners: SpinnerDef[];
    items: InventoryItem[];
    itemAssign: ItemAssign;
    cards: Card[];
    packs: string[];
    board: Board;
  }) => void;
  gameId?: string;
  media?: MediaStore;
  metadata?: DesignerMetadata;
}) {
  const start = gameStart ?? emptyGameStart();
  const [fallbackMedia] = useState(() => memoryMediaStore());
  const mediaStore = media ?? fallbackMedia;
  const [sideTab, setSideTab] = useState<DesignerSideTab>('tiles');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSpinnerId, setSelectedSpinnerId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [levelConfirm, setLevelConfirm] = useState<'delete' | 'reset' | null>(null);
  const catalog = listDraftPackIds(cards, packs ?? []);
  const spinnerList = spinners ?? [];
  const itemList = items ?? [];
  const assignMode = itemAssign ?? 'random';
  const draftCards = cards;
  const floor = board.floors.find((f) => f.id === selectedFloorId) ?? board.floors[0];
  if (!floor) return <p className="text-slate-400">This draft has no levels.</p>;
  const vanilla = isVanillaFloor(floor);

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
    if (tool === 'room') {
      if (existing) {
        onSelectCell(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeRoom(board, floor.id, col, row, id));
      onSelectCell(id);
      return;
    }
    if (tool === 'door') {
      if (!existing) return;
      if (existing.kind === 'door') {
        onSelectCell(existing.id);
        return;
      }
      onBoardChange(placeDoor(board, floor.id, existing.id));
      onSelectCell(existing.id);
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

  const tabClass = (id: DesignerSideTab) =>
    `rounded-md px-2 py-1 text-sm ${
      sideTab === id ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
    }`;

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[2fr_1fr]">
      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
        <div
          className="flex min-w-0 flex-nowrap items-end justify-center"
          data-testid="designer-toolbar"
        >
          <BoardShapeFields
            shape={normalizeShape(floor.shape)}
            disabled={!vanilla}
            onChange={(shape) => onBoardChange(applyFloorShape(board, floor.id, shape))}
          />
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
        <div
          className="shrink-0 border-t border-slate-800"
          data-testid="designer-bottom-pane"
        >
          <div
            className="flex min-w-0 flex-nowrap items-end gap-2 overflow-x-auto border-b border-slate-800 py-2"
            data-testid="designer-bottom-row-tools"
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
              onRequestDelete={() => setLevelConfirm('delete')}
              onRequestReset={() => setLevelConfirm('reset')}
              resetDisabled={vanilla}
              onRename={(label) => onBoardChange(renameFloor(board, floor.id, label))}
            />
            <DesignerPalette tool={tool} onToolChange={onToolChange} className="ml-auto shrink-0 justify-end" />
          </div>
          <div
            className="min-h-10 border-b border-slate-800"
            data-testid="designer-bottom-row-blank"
            aria-hidden
          />
          <div
            className="flex flex-wrap items-center justify-between gap-2 py-2"
            data-testid="designer-bottom-row-meta"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
              <span data-testid="designer-last-saved">{formatDesignerLastSaved(metadata?.lastSaved)}</span>
              <span data-testid="designer-status">
                {formatDesignerStatus(metadata?.status ?? 'draft', metadata?.version)}
              </span>
              <span data-testid="designer-saved-location">{metadata?.savedLocation ?? 'This device'}</span>
            </div>
            <Button type="button" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
          </div>
        </div>
      </div>
      <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden max-lg:min-h-[36rem]">
        <div className="flex gap-1" data-testid="designer-side-tabs" role="tablist" aria-label="Designer side pane">
          <button type="button" role="tab" aria-selected={sideTab === 'levels'} className={tabClass('levels')} onClick={() => setSideTab('levels')}>
            Levels
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'tiles'} className={tabClass('tiles')} onClick={() => setSideTab('tiles')}>
            Tiles
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'packs'} className={tabClass('packs')} onClick={() => setSideTab('packs')}>
            Packs
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'spinners'} className={tabClass('spinners')} onClick={() => setSideTab('spinners')}>
            Spinners
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'players'} className={tabClass('players')} onClick={() => setSideTab('players')}>
            Players
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'start'} className={tabClass('start')} onClick={() => setSideTab('start')}>
            Start
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" data-testid="tile-actions-pane">
          {sideTab === 'spinners' ? (
            <SpinnerEditor
              spinners={spinnerList}
              selectedId={selectedSpinnerId}
              onSelect={setSelectedSpinnerId}
              onCreate={() => {
                const id = nextSpinnerId(spinnerList);
                const next = createSpinner(spinnerList, id);
                onCatalogChange?.({
                  spinners: next,
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
                setSelectedSpinnerId(id);
              }}
              onRename={(name) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: renameSpinner(spinnerList, selectedSpinnerId, name),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onDelete={() => {
                if (!selectedSpinnerId) return;
                const refs = rewriteSpinnerRefs(board, draftCards, selectedSpinnerId, undefined);
                const nextSpinners = deleteSpinner(spinnerList, selectedSpinnerId);
                onCatalogChange?.({
                  spinners: nextSpinners,
                  items: itemList,
                  itemAssign: assignMode,
                  cards: refs.cards,
                  packs: catalog,
                  board: refs.board,
                });
                if (refs.board !== board) onBoardChange(refs.board);
                if (refs.cards !== draftCards) {
                  onDraftChange?.({ cards: refs.cards, packs: catalog, board: refs.board });
                }
                setSelectedSpinnerId(nextSpinners[0]?.id ?? null);
              }}
              onSplit={(split) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: setSplit(spinnerList, selectedSpinnerId, split),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onLinked={(linked) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: updateSpinner(spinnerList, selectedSpinnerId, { linked }),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onAddSegment={() => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: addSegment(spinnerList, selectedSpinnerId),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onRemoveSegment={(segmentId) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: removeSegment(spinnerList, selectedSpinnerId, segmentId),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onSegmentLabel={(segmentId, label) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: setSegmentLabel(spinnerList, selectedSpinnerId, segmentId, label),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onSegmentPercent={(segmentId, percent) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: setSegmentPercent(spinnerList, selectedSpinnerId, segmentId, percent),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
            />
          ) : sideTab === 'players' ? (
            <PlayerEditor
              items={itemList}
              itemAssign={assignMode}
              selectedId={selectedItemId}
              onSelect={setSelectedItemId}
              onCreate={() => {
                const id = nextItemId(itemList);
                const next = createItem(itemList, id);
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: next,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
                setSelectedItemId(id);
              }}
              onRename={(name) => {
                if (!selectedItemId) return;
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: updateItem(itemList, selectedItemId, { name }),
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onStarting={(starting) => {
                if (!selectedItemId) return;
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: updateItem(itemList, selectedItemId, { starting }),
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onDelete={() => {
                if (!selectedItemId) return;
                const next = deleteItem(itemList, selectedItemId);
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: next,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
                setSelectedItemId(next[0]?.id ?? null);
              }}
              onAssign={(mode) => {
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: itemList,
                  itemAssign: mode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
            />
          ) : sideTab === 'levels' ? (
            <HoldEditor
              floor={floor}
              packIds={catalog}
              onChange={(patch) => onBoardChange(setFloorHold(board, floor.id, patch))}
            />
          ) : sideTab === 'start' ? (
            <StartEditor
              value={start}
              gameId={gameId ?? 'draft'}
              media={mediaStore}
              onChange={(next) => onGameStartChange?.(next)}
            />
          ) : sideTab === 'tiles' ? (
            <CellInspector
              board={board}
              floorId={floor.id}
              cellId={selectedCellId}
              packIds={listPackIds(cards, catalog)}
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
              onClearDoor={() => {
                if (!selectedCellId) return;
                onBoardChange(clearDoor(board, floor.id, selectedCellId));
              }}
              onClear={() => {
                if (!selectedCellId) return;
                onBoardChange(clearCell(board, floor.id, selectedCellId));
              }}
              spinners={spinnerList}
              onSetSpinner={(spinnerId) => {
                if (!selectedCellId) return;
                onBoardChange(setCellSpinner(board, floor.id, selectedCellId, spinnerId));
              }}
              onSetHudWidget={(widget) => {
                if (!selectedCellId) return;
                onBoardChange(setHudWidget(board, floor.id, selectedCellId, widget));
              }}
              gameId={gameId}
              media={mediaStore}
              onSetAudio={(audio) => {
                if (!selectedCellId) return;
                onBoardChange(setCellAudio(board, floor.id, selectedCellId, audio));
              }}
              onSetImage={(image: ImageRef | undefined) => {
                if (!selectedCellId) return;
                onBoardChange(setCellImage(board, floor.id, selectedCellId, image));
              }}
              onSetVideo={(video: VideoRef | undefined) => {
                if (!selectedCellId) return;
                onBoardChange(setCellVideo(board, floor.id, selectedCellId, video));
              }}
            />
          ) : (
            <PackEditor
              packs={catalog}
              cards={draftCards}
              selectedPackId={selectedPackId}
              selectedCardId={selectedCardId}
              onSelectPack={(id) => {
                setSelectedPackId(id);
                setSelectedCardId(null);
              }}
              onSelectCard={setSelectedCardId}
              onCreatePack={() => {
                const id = nextPackId(catalog);
                const nextPacks = createPack(catalog, id);
                onDraftChange?.({ cards: draftCards, packs: nextPacks, board });
                setSelectedPackId(id);
                setSelectedCardId(null);
              }}
              onRenamePack={(nextId) => {
                if (!selectedPackId) return;
                const next = renamePack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  from: selectedPackId,
                  to: nextId,
                });
                onDraftChange?.(next);
                if (next.board !== board) onBoardChange(next.board);
                setSelectedPackId(next.packIds.includes(nextId.trim()) ? nextId.trim() : selectedPackId);
              }}
              onDeletePack={() => {
                if (!selectedPackId) return;
                const next = deletePack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  packId: selectedPackId,
                });
                onDraftChange?.(next);
                if (next.board !== board) onBoardChange(next.board);
                setSelectedPackId(next.packIds[0] ?? null);
                setSelectedCardId(null);
              }}
              onCreateCard={() => {
                if (!selectedPackId) return;
                const n = draftCards.filter((card) => card.pack === selectedPackId).length + 1;
                const card: Card = {
                  id: nextCardId(draftCards, selectedPackId),
                  pack: selectedPackId,
                  title: `Card ${n}`,
                };
                onDraftChange?.({
                  cards: addCard(draftCards, card),
                  packs: catalog,
                  board,
                });
                setSelectedCardId(card.id);
              }}
              onUpdateCard={(patch) => {
                if (!selectedCardId) return;
                onDraftChange?.({
                  cards: updateCard(draftCards, selectedCardId, patch),
                  packs: catalog,
                  board,
                });
              }}
              onDeleteCard={() => {
                if (!selectedCardId) return;
                onDraftChange?.({
                  cards: deleteCard(draftCards, selectedCardId),
                  packs: catalog,
                  board,
                });
                setSelectedCardId(null);
              }}
              spinners={spinnerList}
              gameId={gameId}
              media={mediaStore}
            />
          )}
        </div>
      </aside>
      <LevelConfirmDialog
        open={levelConfirm === 'delete'}
        title={`Delete ${floor.label}?`}
        description="This removes the level. It cannot be undone."
        confirmLabel="Delete level"
        onOpenChange={(open) => {
          if (!open) setLevelConfirm(null);
        }}
        onConfirm={() => {
          const idx = board.floors.findIndex((f) => f.id === floor.id);
          const next = deleteFloor(board, floor.id);
          const pick = next.floors[Math.min(idx, next.floors.length - 1)] ?? next.floors[0];
          onBoardChange(next);
          onSelectFloor(pick?.id ?? floor.id);
          onSelectCell(null);
          setLevelConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={levelConfirm === 'reset'}
        title={`Reset ${floor.label}?`}
        description="This clears Start, stairs, rooms, and tile settings on this level. Shape and size stay. It cannot be undone."
        confirmLabel="Reset level"
        onOpenChange={(open) => {
          if (!open) setLevelConfirm(null);
        }}
        onConfirm={() => {
          onBoardChange(resetFloor(board, floor.id));
          onSelectCell(null);
          setLevelConfirm(null);
        }}
      />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="flex h-[min(80vh,40rem)] w-full max-w-4xl flex-col sm:max-w-4xl"
          data-testid="preview-dialog"
        >
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <FloorPreview board={board} floorId={floor.id} selectedCellId={selectedCellId ?? undefined} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
