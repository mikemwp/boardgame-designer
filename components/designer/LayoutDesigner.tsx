'use client';

import { useEffect, useState } from 'react';
import { FloorPreview } from '@/components/board/FloorPreview';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';
import { CellInspector } from '@/components/designer/CellInspector';
import { DesignerPalette, type DesignerTool } from '@/components/designer/DesignerPalette';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { HoldEditor } from '@/components/designer/HoldEditor';
import { LevelConfirmDialog } from '@/components/designer/LevelConfirmDialog';
import { PlayerEditor } from '@/components/designer/PlayerEditor';
import { SpinnerEditor } from '@/components/designer/SpinnerEditor';
import { SpinnerPreview } from '@/components/designer/SpinnerPreview';
import { isVanillaFloor, isVanillaRoom, resetFloor } from '@/lib/designer/level-size';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { RoomTabs } from '@/components/designer/RoomTabs';
import { BoardEditor } from '@/components/designer/BoardEditor';
import { PackEditor } from '@/components/designer/PackEditor';
import { setCellFace, setFloorLook } from '@/lib/designer/board-look';
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
  applyRoomShape,
  attachRoom,
  attachStair,
  clearStair,
  deleteFloor,
  deleteRoom,
  eraseCell,
  linkStair,
  setFloorFinal,
  setStairDestinationFloor,
  setStairLandingAt,
  setStairLandingOnSlot,
  setStairRollAgain,
  moveCell,
  moveCellToSlot,
  nextCellId,
  nextFloorId,
  nextLevelLabel,
  placeBoard,
  placeCorridor,
  placeCorridorOnSlot,
  placeHud,
  attachDoor,
  canvasClearCell,
  fillFreeWithBoard,
  setDoorExit,
  clearCell,
  renameFloor,
  renameRoom,
  resetRoom,
  setCellAudio,
  setCellImage,
  setCellVideo,
  setCellDeal,
  setCellPack,
  setCellSpinner,
  setCellItem,
  setEndCell,
  setFloorBackground,
  setFloorHold,
  setHudWidget,
  setRoomMode,
  setStartCell,
} from '@/lib/designer/mutate';
import { roomAsFloor, replaceRoomFloor, roomById } from '@/lib/designer/rooms';
import {
  addCard,
  copyCard,
  copyPack,
  createPack,
  deleteCard,
  deletePack,
  listDraftPackIds,
  nextCardId,
  nextPackId,
  removeCard,
  removePack,
  renamePack,
  setPackBack,
  updateCard,
  type FloatingPack,
} from '@/lib/designer/packs';
import type { CopyCardSource, CopyPackSource } from '@/lib/library/floating';
import {
  addSegment,
  createSpinner,
  deleteSpinner,
  nextSpinnerId,
  removeSegment,
  renameSpinner,
  rewriteSpinnerRefs,
  setSegmentCount,
  setSegmentLabel,
  setSegmentPercent,
  setSplit,
  updateSpinner,
} from '@/lib/designer/spinners';
import { createItem, deleteItem, nextItemId, rewriteItemRefs, updateItem } from '@/lib/designer/items';
import { ItemEditor } from '@/components/designer/ItemEditor';
import { ImportExportPanel } from '@/components/designer/ImportExportPanel';
import type { LayoutIssue } from '@/lib/designer/validate';
import { createBoard, type Board } from '@/lib/engine/board';
import { cellAt, listPackIds } from '@/lib/engine/layout';
import { normalizeShape } from '@/lib/engine/shape';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { inferShape } from '@/lib/engine/shape';
import { emptyGameStart } from '@/lib/engine/audio';
import type { Card, GameConfig, GameStart, ImageRef, InventoryItem, ItemAssign, SpinnerDef, VideoRef } from '@/lib/engine/types';
import { defaultGameConfig } from '@/lib/engine/types';
import type { GameStatus } from '@/lib/library/types';
import { memoryMediaStore, type MediaStore } from '@/lib/library/media-store';
import {
  formatDesignerLastSaved,
  formatDesignerStatus,
  LIBRARY_SAVE_LOCATION,
} from '@/lib/library/version';

export type DesignerSideTab =
  | 'levels'
  | 'tiles'
  | 'packs'
  | 'board'
  | 'spinners'
  | 'items'
  | 'players'
  | 'start'
  | 'imports';

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
  packBacks,
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
  gameConfig,
  onConfigChange,
  spinners,
  items,
  itemAssign,
  onCatalogChange,
  gameId,
  media,
  metadata,
  gameTitle,
  copyPackSources,
  copyCardSources,
  resolveCopyPack,
  resolveCopyCard,
  onFloatPack,
  onFloatCard,
  onDesignerContextChange,
  onImportCards,
  onExportJson,
  onExportZip,
  onImportGame,
}: {
  board: Board;
  cards: Card[];
  packs?: string[];
  selectedFloorId: string;
  selectedCellId: string | null;
  tool: DesignerTool;
  issues: LayoutIssue[];
  onBoardChange: (board: Board) => void;
  onDraftChange?: (next: {
    cards: Card[];
    packs: string[];
    board: Board;
    packBacks?: Record<string, ImageRef>;
  }) => void;
  packBacks?: Record<string, ImageRef>;
  copyPackSources?: CopyPackSource[];
  copyCardSources?: CopyCardSource[];
  resolveCopyPack?: (source: CopyPackSource) => { name: string; cards: Card[]; backImage?: ImageRef } | undefined;
  resolveCopyCard?: (source: CopyCardSource) => Card | undefined;
  onFloatPack?: (pack: FloatingPack) => void;
  onFloatCard?: (card: Card) => void;
  onDesignerContextChange?: (next: { levelLabel: string; roomName?: string }) => void;
  onImportCards?: (cards: Card[]) => void;
  onExportJson?: () => void;
  onExportZip?: () => void;
  onImportGame?: (file: File) => void;
  onSelectFloor: (id: string) => void;
  onSelectCell: (id: string | null) => void;
  onToolChange: (tool: DesignerTool) => void;
  gameStart?: GameStart;
  onGameStartChange?: (start: GameStart) => void;
  gameConfig?: GameConfig;
  onConfigChange?: (patch: Partial<GameConfig>) => void;
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
  gameTitle?: string;
}) {
  const start = gameStart ?? emptyGameStart();
  const [fallbackMedia] = useState(() => memoryMediaStore());
  const mediaStore = media ?? fallbackMedia;
  const [sideTab, setSideTab] = useState<DesignerSideTab>('tiles');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKind, setPreviewKind] = useState<'board' | 'spinner'>('board');
  const [previewFloorId, setPreviewFloorId] = useState(selectedFloorId);
  const [previewRoomId, setPreviewRoomId] = useState<string | null>(null);
  const [previewSpinnerId, setPreviewSpinnerId] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSpinnerId, setSelectedSpinnerId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [levelConfirm, setLevelConfirm] = useState<'delete' | 'reset' | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomConfirm, setRoomConfirm] = useState<'delete' | 'reset' | null>(null);
  const [landingDestFloorId, setLandingDestFloorId] = useState<string | null>(null);
  const catalog = listDraftPackIds(cards, packs ?? []);
  const backs = packBacks ?? {};
  const spinnerList = spinners ?? [];
  const itemList = items ?? [];
  const assignMode = itemAssign ?? 'random';
  const draftCards = cards;
  const floor = board.floors.find((f) => f.id === selectedFloorId) ?? board.floors[0];
  const selectedRoom = roomById(board, selectedRoomId ?? undefined);
  const viewingRoom = Boolean(selectedRoom && selectedRoom.mode === 'multi');
  useEffect(() => {
    if (!floor) return;
    onDesignerContextChange?.({
      levelLabel: floor.label,
      roomName: viewingRoom ? selectedRoom?.name : undefined,
    });
  }, [floor, viewingRoom, selectedRoom?.name, onDesignerContextChange]);
  if (!floor) return <p className="text-slate-400">This draft has no levels.</p>;
  const originCell = selectedCellId
    ? floor.cells.find((cell) => cell.id === selectedCellId)
    : undefined;
  const originStair =
    originCell?.kind === 'stair' && originCell.stairId
      ? board.stairs.find((stair) => stair.id === originCell.stairId)
      : undefined;
  const destFloorId =
    landingDestFloorId ?? (originStair && !originStair.legal ? originStair.toFloorId || null : null);
  const destFloor = destFloorId ? board.floors.find((entry) => entry.id === destFloorId) : undefined;
  const pickingLanding = Boolean(destFloor && originStair);
  const canvasFloor =
    pickingLanding && destFloor
      ? destFloor
      : viewingRoom && selectedRoom
        ? roomAsFloor(selectedRoom)
        : floor;
  const canvasBoard =
    pickingLanding ? board : viewingRoom ? createBoard([canvasFloor], [], board.rooms) : board;
  const vanillaFloor = isVanillaFloor(floor);
  const multiRooms = (board.rooms ?? []).filter((room) => room.mode === 'multi');
  const roomForSize =
    selectedRoom?.mode === 'multi' ? selectedRoom : multiRooms[0];
  const vanillaRoom = roomForSize ? isVanillaRoom(roomForSize) : true;
  const selectedCanvasCell = selectedCellId
    ? canvasFloor.cells.find((cell) => cell.id === selectedCellId)
    : undefined;
  const playableSelected = Boolean(
    selectedCanvasCell && selectedCanvasCell.kind !== 'hud' && selectedCanvasCell.kind !== 'board',
  );
  const commitCanvas = (next: Board) => {
    if (!viewingRoom || !selectedRoom) {
      onBoardChange(next);
      return;
    }
    const nextFloor = next.floors[0];
    if (nextFloor) onBoardChange(replaceRoomFloor(board, selectedRoom.id, nextFloor));
  };

  const shapeKind = inferShape(canvasFloor).kind;
  const isPolar = shapeKind === 'circle' || shapeKind === 'hub-spoke' || shapeKind === 'hub-spoke-wheel';

  const selectTile = (id: string | null) => {
    onSelectCell(id);
    if (id) setSideTab('tiles');
  };

  const activateCartesian = (col: number, row: number) => {
    if (pickingLanding && originStair && destFloor) {
      const next = setStairLandingAt(board, originStair.id, destFloor.id, col, row);
      onBoardChange(next);
      if (next.stairs.find((stair) => stair.id === originStair.id)?.legal) {
        setLandingDestFloorId(null);
      }
      return;
    }
    const existing = cellAt(canvasFloor, col, row);
    if (tool === 'erase') {
      if (existing) {
        commitCanvas(eraseCell(canvasBoard, canvasFloor.id, existing.id));
        onSelectCell(null);
      }
      return;
    }
    if (tool === 'corridor') {
      if (existing) {
        selectTile(existing.id);
        return;
      }
      const id = nextCellId(canvasFloor);
      commitCanvas(placeCorridor(canvasBoard, canvasFloor.id, col, row, id));
      selectTile(id);
      return;
    }
    if (tool === 'hud') {
      if (existing) {
        selectTile(existing.id);
        return;
      }
      const id = nextCellId(canvasFloor);
      commitCanvas(placeHud(canvasBoard, canvasFloor.id, col, row, id));
      selectTile(id);
      return;
    }
    if (tool === 'board') {
      if (existing) {
        selectTile(existing.id);
        return;
      }
      const id = nextCellId(canvasFloor);
      commitCanvas(placeBoard(canvasBoard, canvasFloor.id, col, row, id));
      selectTile(id);
      return;
    }
    if (tool === 'door') {
      if (!viewingRoom || !existing) return;
      if (existing.kind === 'door') {
        selectTile(existing.id);
        return;
      }
      commitCanvas(attachDoor(canvasBoard, canvasFloor.id, existing.id));
      selectTile(existing.id);
      return;
    }
    if (tool === 'room') {
      if (viewingRoom) return;
      if (!existing) return;
      if (existing.kind === 'room') {
        selectTile(existing.id);
        return;
      }
      onBoardChange(attachRoom(board, floor.id, existing.id));
      selectTile(existing.id);
      return;
    }
    if (tool === 'stair') {
      if (viewingRoom || !existing) return;
      if (existing.kind === 'stair') {
        selectTile(existing.id);
        return;
      }
      onBoardChange(attachStair(board, floor.id, existing.id));
      selectTile(existing.id);
      return;
    }
    selectTile(existing?.id ?? null);
  };

  const activatePolar = (slotId: string) => {
    if (pickingLanding && originStair && destFloor) {
      const next = setStairLandingOnSlot(board, originStair.id, destFloor.id, slotId);
      onBoardChange(next);
      if (next.stairs.find((stair) => stair.id === originStair.id)?.legal) {
        setLandingDestFloorId(null);
      }
      return;
    }
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
        selectTile(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeCorridorOnSlot(board, floor.id, slotId, id));
      selectTile(id);
      return;
    }
    if (tool === 'stair') {
      if (!existing) return;
      if (existing.kind === 'stair') {
        selectTile(existing.id);
        return;
      }
      onBoardChange(attachStair(board, floor.id, existing.id));
      selectTile(existing.id);
      return;
    }
    selectTile(existing?.id ?? null);
  };

  const tabClass = (id: DesignerSideTab) =>
    `rounded-md px-2 py-1 text-sm ${
      sideTab === id ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
    }`;

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[2fr_1fr]">
      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
        <div
          className="relative flex min-w-0 flex-nowrap items-end justify-center"
          data-testid="designer-toolbar"
        >
          <DesignerPalette
            tool={pickingLanding ? 'stair' : tool}
            onToolChange={(next) => {
              if (pickingLanding) return;
              onToolChange(next);
            }}
            viewingRoom={viewingRoom}
            onFill={() => commitCanvas(fillFreeWithBoard(canvasBoard, canvasFloor.id))}
            onClear={() => {
              if (!selectedCellId) return;
              commitCanvas(canvasClearCell(canvasBoard, canvasFloor.id, selectedCellId));
              onSelectCell(null);
            }}
            clearDisabled={!selectedCellId}
            onSetStart={() => {
              if (!selectedCellId) return;
              commitCanvas(setStartCell(canvasBoard, canvasFloor.id, selectedCellId));
            }}
            onSetEnd={() => {
              if (!selectedCellId) return;
              commitCanvas(setEndCell(canvasBoard, canvasFloor.id, selectedCellId));
            }}
            isStart={Boolean(selectedCanvasCell?.start)}
            isEnd={Boolean(selectedCanvasCell?.end)}
            startDisabled={!playableSelected}
            endDisabled={!playableSelected}
            className="justify-center"
          />
          <Button
            type="button"
            className="absolute right-0"
            onClick={() => {
              setPreviewKind('board');
              setPreviewFloorId(floor.id);
              setPreviewRoomId(viewingRoom ? selectedRoom?.id ?? null : null);
              setPreviewOpen(true);
            }}
          >
            Preview
          </Button>
        </div>
        <div
          className="min-h-0 min-w-0 flex-1 overflow-hidden"
          data-testid="designer-canvas-floor"
          data-floor-id={canvasFloor.id}
        >
          <LayoutGrid
            floor={canvasFloor}
            selectedCellId={pickingLanding ? undefined : selectedCellId ?? undefined}
            onSlotActivate={activateCartesian}
            onMoveCell={(cellId, col, row) =>
              commitCanvas(moveCell(canvasBoard, canvasFloor.id, cellId, col, row))
            }
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
                setSelectedRoomId(null);
                onSelectFloor(id);
                onSelectCell(null);
                setSideTab('levels');
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
              onRename={(label) => onBoardChange(renameFloor(board, floor.id, label))}
              resetDisabled={vanillaFloor}
            />
            <div className="ml-auto shrink-0">
              <BoardShapeFields
                scope="level"
                align="end"
                shape={normalizeShape(floor.shape)}
                disabled={!vanillaFloor}
                onChange={(shape) => onBoardChange(applyFloorShape(board, floor.id, shape))}
              />
            </div>
          </div>
          <div
            className="flex min-h-10 flex-nowrap items-end gap-2 border-b border-slate-800 py-2"
            data-testid="designer-bottom-row-blank"
          >
            <RoomTabs
              rooms={board.rooms ?? []}
              selectedRoomId={selectedRoomId}
              onSelect={(id) => {
                setSelectedRoomId(id);
                onSelectCell(null);
              }}
              onRename={(name) => {
                const target = selectedRoom ?? (board.rooms ?? []).find((room) => room.mode === 'multi');
                if (!target) return;
                onBoardChange(renameRoom(board, target.id, name));
              }}
              onRequestReset={() => setRoomConfirm('reset')}
              onRequestDelete={() => setRoomConfirm('delete')}
              resetDisabled={!roomForSize || vanillaRoom}
            />
            {roomForSize ? (
              <div className="ml-auto shrink-0">
                <BoardShapeFields
                  scope="room"
                  align="end"
                  shape={roomForSize.shape ?? { kind: 'square', tilesPerSide: 3 }}
                  disabled={!vanillaRoom}
                  maxSquare={4}
                  maxRect={{ length: 5, width: 4 }}
                  onChange={(shape) => onBoardChange(applyRoomShape(board, roomForSize.id, shape))}
                />
              </div>
            ) : null}
          </div>
          <div
            className="grid grid-cols-3 items-center gap-2 py-2 text-sm text-slate-300"
            data-testid="designer-bottom-row-meta"
          >
            <span data-testid="designer-last-saved">{formatDesignerLastSaved(metadata?.lastSaved)}</span>
            <span className="text-center" data-testid="designer-status">
              {formatDesignerStatus(metadata?.status ?? 'draft', metadata?.version)}
            </span>
            <span className="text-right" data-testid="designer-saved-location">
              {metadata?.savedLocation ?? LIBRARY_SAVE_LOCATION}
            </span>
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
          <button type="button" role="tab" aria-selected={sideTab === 'board'} className={tabClass('board')} onClick={() => setSideTab('board')}>
            Board
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'spinners'} className={tabClass('spinners')} onClick={() => setSideTab('spinners')}>
            Spinners
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'items'} className={tabClass('items')} onClick={() => setSideTab('items')}>
            Items
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'players'} className={tabClass('players')} onClick={() => setSideTab('players')}>
            Players
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'start'} className={tabClass('start')} onClick={() => setSideTab('start')}>
            Start
          </button>
          <button type="button" role="tab" aria-selected={sideTab === 'imports'} className={tabClass('imports')} onClick={() => setSideTab('imports')}>
            Imports
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" data-testid="tile-actions-pane">
          {sideTab === 'imports' ? (
            <ImportExportPanel
              onImportCards={(incoming) => {
                if (onImportCards) {
                  onImportCards(incoming);
                  return;
                }
                const nextCards = [...draftCards, ...incoming];
                onDraftChange?.({
                  cards: nextCards,
                  packs: listDraftPackIds(nextCards, catalog),
                  board,
                  packBacks: backs,
                });
              }}
              onExportJson={onExportJson ?? (() => {})}
              onExportZip={onExportZip ?? (() => {})}
              onImportGame={onImportGame ?? (() => {})}
            />
          ) : sideTab === 'items' ? (
            <ItemEditor
              items={itemList}
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
              onChange={(patch) => {
                if (!selectedItemId) return;
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: updateItem(itemList, selectedItemId, patch),
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onDelete={() => {
                if (!selectedItemId) return;
                const refs = rewriteItemRefs(board, draftCards, selectedItemId, undefined);
                const next = deleteItem(itemList, selectedItemId);
                onCatalogChange?.({
                  spinners: spinnerList,
                  items: next,
                  itemAssign: assignMode,
                  cards: refs.cards,
                  packs: catalog,
                  board: refs.board,
                });
                if (refs.board !== board) onBoardChange(refs.board);
                if (refs.cards !== draftCards) {
                  onDraftChange?.({ cards: refs.cards, packs: catalog, board: refs.board });
                }
                setSelectedItemId(next[0]?.id ?? null);
              }}
              gameId={gameId}
              media={mediaStore}
            />
          ) : sideTab === 'spinners' ? (
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
              onSegmentCount={(count) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: setSegmentCount(spinnerList, selectedSpinnerId, count),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onTemplate={(template) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: updateSpinner(spinnerList, selectedSpinnerId, { template }),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onImage={(image) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: updateSpinner(spinnerList, selectedSpinnerId, { image }),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onAudio={(audio) => {
                if (!selectedSpinnerId) return;
                onCatalogChange?.({
                  spinners: updateSpinner(spinnerList, selectedSpinnerId, { audio }),
                  items: itemList,
                  itemAssign: assignMode,
                  cards: draftCards,
                  packs: catalog,
                  board,
                });
              }}
              onPreview={() => {
                if (!selectedSpinnerId) return;
                setPreviewKind('spinner');
                setPreviewSpinnerId(selectedSpinnerId);
                setPreviewOpen(true);
              }}
              gameId={gameId}
              media={mediaStore}
            />
          ) : sideTab === 'players' ? (
            <PlayerEditor
              items={itemList}
              itemAssign={assignMode}
              selectedId={selectedItemId}
              onSelect={setSelectedItemId}
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
              onChange={(patch) => {
                if ('final' in patch) {
                  onBoardChange(setFloorFinal(board, floor.id, Boolean(patch.final)));
                }
                if ('holdEnabled' in patch || patch.holdQuotas) {
                  onBoardChange(setFloorHold(board, floor.id, patch));
                }
              }}
              onRename={(label) => onBoardChange(renameFloor(board, floor.id, label))}
              gameId={gameId ?? 'draft'}
              media={mediaStore}
              onBackgroundChange={(background) =>
                onBoardChange(setFloorBackground(board, floor.id, background))
              }
            />
          ) : sideTab === 'start' ? (
            <StartEditor
              value={start}
              gameId={gameId ?? 'draft'}
              media={mediaStore}
              onChange={(next) => onGameStartChange?.(next)}
              config={gameConfig ?? defaultGameConfig()}
              spinners={spinnerList}
              onConfigChange={onConfigChange}
            />
          ) : sideTab === 'tiles' ? (
            <CellInspector
              board={pickingLanding ? board : viewingRoom ? canvasBoard : board}
              floorId={pickingLanding && originStair ? originStair.fromFloorId : canvasFloor.id}
              cellId={selectedCellId}
              packIds={listPackIds(cards, catalog)}
              onSetPack={(packId) => {
                if (!selectedCellId) return;
                commitCanvas(setCellDeal(canvasBoard, canvasFloor.id, selectedCellId, packId, 'draw'));
              }}
              onSetDeal={(packId, mode, cardId) => {
                if (!selectedCellId) return;
                commitCanvas(setCellDeal(canvasBoard, canvasFloor.id, selectedCellId, packId, mode, cardId));
              }}
              cards={draftCards}
              onSetStart={() => {
                if (!selectedCellId) return;
                commitCanvas(setStartCell(canvasBoard, canvasFloor.id, selectedCellId));
              }}
              onSetEnd={() => {
                if (!selectedCellId) return;
                commitCanvas(setEndCell(canvasBoard, canvasFloor.id, selectedCellId));
              }}
              onAttachStair={() => {
                if (!selectedCellId || viewingRoom) return;
                onBoardChange(attachStair(board, floor.id, selectedCellId));
              }}
              onLinkStair={(toFloorId, toCellId) => {
                const cell = floor.cells.find((c) => c.id === selectedCellId);
                if (!cell?.stairId) return;
                onBoardChange(linkStair(board, cell.stairId, toFloorId, toCellId));
              }}
              onChooseDestFloor={(toFloorId) => {
                const cell = floor.cells.find((c) => c.id === selectedCellId);
                if (!cell?.stairId) return;
                setSelectedRoomId(null);
                setLandingDestFloorId(toFloorId || null);
                onBoardChange(setStairDestinationFloor(board, cell.stairId, toFloorId));
              }}
              landingPickActive={pickingLanding}
              onSetRollAgain={(patch) => {
                const cell = floor.cells.find((c) => c.id === selectedCellId);
                if (!cell?.stairId) return;
                onBoardChange(setStairRollAgain(board, cell.stairId, patch, draftCards));
              }}
              onClearStair={() => {
                if (!selectedCellId || viewingRoom) return;
                onBoardChange(clearStair(board, floor.id, selectedCellId));
              }}
              onClear={() => {
                if (!selectedCellId) return;
                commitCanvas(clearCell(canvasBoard, canvasFloor.id, selectedCellId));
              }}
              onSetRoomMode={(mode) => {
                if (!selectedCellId) return;
                const host = floor.cells.find((cell) => cell.id === selectedCellId);
                if (!host?.roomId) return;
                onBoardChange(setRoomMode(board, host.roomId, mode));
              }}
              spinners={spinnerList}
              onSetSpinner={(spinnerId) => {
                if (!selectedCellId) return;
                commitCanvas(setCellSpinner(canvasBoard, canvasFloor.id, selectedCellId, spinnerId));
              }}
              items={itemList}
              onSetItem={(itemId) => {
                if (!selectedCellId) return;
                commitCanvas(setCellItem(canvasBoard, canvasFloor.id, selectedCellId, itemId));
              }}
              onSetHudWidget={(widget) => {
                if (!selectedCellId) return;
                commitCanvas(setHudWidget(canvasBoard, canvasFloor.id, selectedCellId, widget));
              }}
              gameId={gameId}
              media={mediaStore}
              onSetAudio={(audio) => {
                if (!selectedCellId) return;
                commitCanvas(setCellAudio(canvasBoard, canvasFloor.id, selectedCellId, audio));
              }}
              onSetImage={(image: ImageRef | undefined) => {
                if (!selectedCellId) return;
                commitCanvas(setCellImage(canvasBoard, canvasFloor.id, selectedCellId, image));
              }}
              onSetVideo={(video: VideoRef | undefined) => {
                if (!selectedCellId) return;
                commitCanvas(setCellVideo(canvasBoard, canvasFloor.id, selectedCellId, video));
              }}
              onSetFace={(face) => {
                if (!selectedCellId) return;
                commitCanvas(setCellFace(canvasBoard, canvasFloor.id, selectedCellId, face));
              }}
              onSetDoorExit={(exit) => {
                if (!selectedCellId) return;
                commitCanvas(setDoorExit(canvasBoard, canvasFloor.id, selectedCellId, exit));
              }}
            />
          ) : sideTab === 'board' ? (
            <BoardEditor
              look={floor.look}
              gameTitle={gameTitle ?? 'Untitled game'}
              gameId={gameId}
              media={mediaStore}
              onChange={(patch) => onBoardChange(setFloorLook(board, floor.id, patch))}
            />
          ) : (
            <PackEditor
              packs={catalog}
              cards={draftCards}
              packBacks={backs}
              selectedPackId={selectedPackId}
              selectedCardId={selectedCardId}
              copyPackSources={copyPackSources}
              copyCardSources={copyCardSources}
              onSelectPack={(id) => {
                setSelectedPackId(id);
                setSelectedCardId(null);
              }}
              onSelectCard={setSelectedCardId}
              onCreatePack={() => {
                const id = nextPackId(catalog);
                const nextPacks = createPack(catalog, id);
                onDraftChange?.({ cards: draftCards, packs: nextPacks, board, packBacks: backs });
                setSelectedPackId(id);
                setSelectedCardId(null);
              }}
              onCopyPack={(source) => {
                const payload = resolveCopyPack?.(source);
                if (!payload) return;
                const next = copyPack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  packBacks: backs,
                  source: payload,
                });
                onDraftChange?.({
                  cards: next.cards,
                  packs: next.packIds,
                  board: next.board,
                  packBacks: next.packBacks,
                });
                if (next.board !== board) onBoardChange(next.board);
                const created = next.packIds.find((id) => !catalog.includes(id));
                setSelectedPackId(created ?? selectedPackId);
                setSelectedCardId(null);
              }}
              onRenamePack={(nextId) => {
                if (!selectedPackId) return;
                const next = renamePack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  packBacks: backs,
                  from: selectedPackId,
                  to: nextId,
                });
                onDraftChange?.({
                  cards: next.cards,
                  packs: next.packIds,
                  board: next.board,
                  packBacks: next.packBacks,
                });
                if (next.board !== board) onBoardChange(next.board);
                setSelectedPackId(next.packIds.includes(nextId.trim()) ? nextId.trim() : selectedPackId);
              }}
              onRemovePack={(packId) => {
                const next = removePack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  packBacks: backs,
                  packId,
                });
                onFloatPack?.(next.floating);
                onDraftChange?.({
                  cards: next.cards,
                  packs: next.packIds,
                  board: next.board,
                  packBacks: next.packBacks,
                });
                if (next.board !== board) onBoardChange(next.board);
                setSelectedPackId(next.packIds[0] ?? null);
                setSelectedCardId(null);
              }}
              onDeletePack={(packId) => {
                const next = deletePack({
                  packIds: catalog,
                  cards: draftCards,
                  board,
                  packBacks: backs,
                  packId,
                });
                onDraftChange?.({
                  cards: next.cards,
                  packs: next.packIds,
                  board: next.board,
                  packBacks: next.packBacks,
                });
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
                  packBacks: backs,
                });
                setSelectedCardId(card.id);
              }}
              onCopyCard={(source) => {
                if (!selectedPackId) return;
                const payload = resolveCopyCard?.(source);
                if (!payload) return;
                onDraftChange?.({
                  cards: copyCard(draftCards, selectedPackId, payload),
                  packs: catalog,
                  board,
                  packBacks: backs,
                });
              }}
              onUpdateCard={(patch) => {
                if (!selectedCardId) return;
                onDraftChange?.({
                  cards: updateCard(draftCards, selectedCardId, patch),
                  packs: catalog,
                  board,
                  packBacks: backs,
                });
              }}
              onRemoveCard={(cardId) => {
                const next = removeCard(draftCards, cardId);
                onFloatCard?.(next.floating);
                onDraftChange?.({
                  cards: next.cards,
                  packs: catalog,
                  board,
                  packBacks: backs,
                });
                setSelectedCardId(null);
              }}
              onDeleteCard={(cardId) => {
                onDraftChange?.({
                  cards: deleteCard(draftCards, cardId),
                  packs: catalog,
                  board,
                  packBacks: backs,
                });
                setSelectedCardId(null);
              }}
              onSetPackBack={(image) => {
                if (!selectedPackId) return;
                onDraftChange?.({
                  cards: draftCards,
                  packs: catalog,
                  board,
                  packBacks: setPackBack(backs, selectedPackId, image),
                });
              }}
              spinners={spinnerList}
              items={itemList}
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
          setSelectedRoomId(null);
          setLevelConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={roomConfirm === 'delete'}
        title={`Delete ${selectedRoom?.name ?? 'room'}?`}
        description="This removes the room and converts the host tile back to a standard tile. It cannot be undone."
        confirmLabel="Delete room"
        onOpenChange={(open) => {
          if (!open) setRoomConfirm(null);
        }}
        onConfirm={() => {
          if (!selectedRoom) {
            setRoomConfirm(null);
            return;
          }
          onBoardChange(deleteRoom(board, selectedRoom.id));
          onSelectCell(null);
          setSelectedRoomId(null);
          setRoomConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={roomConfirm === 'reset'}
        title={`Reset ${selectedRoom?.name ?? 'room'}?`}
        description="This clears the room interior back to a vanilla loop at the current shape and size. The room name stays. It cannot be undone."
        confirmLabel="Reset room"
        onOpenChange={(open) => {
          if (!open) setRoomConfirm(null);
        }}
        onConfirm={() => {
          if (!selectedRoom) {
            setRoomConfirm(null);
            return;
          }
          onBoardChange(resetRoom(board, selectedRoom.id));
          onSelectCell(null);
          setRoomConfirm(null);
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
          <div className="flex flex-wrap gap-2" data-testid="preview-switcher">
            {previewKind === 'spinner'
              ? spinnerList.map((entry) => (
                  <Button
                    key={entry.id}
                    type="button"
                    variant={previewSpinnerId === entry.id ? 'secondary' : 'outline'}
                    onClick={() => {
                      setPreviewSpinnerId(entry.id);
                      setSelectedSpinnerId(entry.id);
                    }}
                  >
                    {entry.name}
                  </Button>
                ))
              : (
                  <>
                    {board.floors.map((entry) => (
                      <Button
                        key={entry.id}
                        type="button"
                        variant={!previewRoomId && previewFloorId === entry.id ? 'secondary' : 'outline'}
                        onClick={() => {
                          setPreviewFloorId(entry.id);
                          setPreviewRoomId(null);
                        }}
                      >
                        {entry.label}
                      </Button>
                    ))}
                    {multiRooms.map((room) => (
                      <Button
                        key={room.id}
                        type="button"
                        variant={previewRoomId === room.id ? 'secondary' : 'outline'}
                        onClick={() => setPreviewRoomId(room.id)}
                      >
                        {room.name}
                      </Button>
                    ))}
                  </>
                )}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {previewKind === 'spinner'
              ? (() => {
                  const previewSpinner =
                    spinnerList.find((entry) => entry.id === previewSpinnerId) ??
                    spinnerList.find((entry) => entry.id === selectedSpinnerId);
                  return previewSpinner ? (
                    <SpinnerPreview key={previewSpinner.id} spinner={previewSpinner} />
                  ) : (
                    <p className="p-4 text-sm text-slate-400">No spinner selected.</p>
                  );
                })()
              : (() => {
                  const previewRoom = previewRoomId ? roomById(board, previewRoomId) : undefined;
                  const previewBoard =
                    previewRoom?.mode === 'multi'
                      ? createBoard([roomAsFloor(previewRoom)], [], board.rooms)
                      : board;
                  const previewId =
                    previewRoom?.mode === 'multi' ? previewRoom.id : previewFloorId;
                  return (
                    <FloorPreview
                      board={previewBoard}
                      floorId={previewId}
                      selectedCellId={selectedCellId ?? undefined}
                      gameTitle={gameTitle}
                    />
                  );
                })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
