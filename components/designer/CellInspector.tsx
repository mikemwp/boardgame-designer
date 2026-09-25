'use client';

import { useState } from 'react';
import { AudioField, MediaField } from '@/components/designer/AudioField';
import { LevelConfirmDialog } from '@/components/designer/LevelConfirmDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { HUD_WIDGETS, hudWidgetOf } from '@/lib/designer/hud';
import { tileActionKind } from '@/lib/designer/tile-chrome';
import { roomById } from '@/lib/designer/rooms';
import type { Board } from '@/lib/engine/board';
import { stairLabel } from '@/lib/engine/layout';
import type { AudioRef, Card, Cell, DoorExit, HudWidget, ImageRef, InventoryItem, RoomMode, SpinnerDef, VideoRef } from '@/lib/engine/types';
import type { MediaStore } from '@/lib/library/media-store';

const HUD_TYPE_OPTIONS: Record<HudWidget, string> = {
  empty: 'Empty slot',
  dice: 'Dice',
  spinner: 'Spinner',
  'last-roll': 'Last roll',
  'player-bar': 'Player bar',
};

function cellHeading(cell: Cell): string {
  return tileActionKind(cell);
}

export function CellInspector({
  board,
  floorId,
  cellId,
  packIds,
  onSetPack,
  onSetDeal,
  cards,
  onSetStart: _onSetStart,
  onSetEnd: _onSetEnd,
  onAttachStair,
  onLinkStair,
  onClearStair,
  onClear,
  onSetHudWidget,
  spinners,
  onSetSpinner,
  items,
  onSetItem,
  gameId,
  media,
  onSetAudio,
  onSetImage,
  onSetVideo,
  onSetFace,
  onSetRoomMode,
  onSetDoorExit,
}: {
  board: Board;
  floorId: string;
  cellId: string | null;
  packIds: string[];
  onSetPack: (packId: string | undefined) => void;
  onSetDeal?: (packId: string | undefined, mode?: 'draw' | 'card', cardId?: string) => void;
  cards?: Card[];
  onSetStart: () => void;
  onSetEnd: () => void;
  onAttachStair: () => void;
  onLinkStair: (toFloorId: string, toCellId: string) => void;
  onClearStair: () => void;
  onClear?: () => void;
  onSetHudWidget?: (widget: HudWidget) => void;
  spinners?: SpinnerDef[];
  onSetSpinner?: (spinnerId: string | undefined) => void;
  items?: InventoryItem[];
  onSetItem?: (itemId: string | undefined) => void;
  gameId?: string;
  media?: MediaStore;
  onSetAudio?: (audio: AudioRef | undefined) => void;
  onSetImage?: (image: ImageRef | undefined) => void;
  onSetVideo?: (video: VideoRef | undefined) => void;
  onSetFace?: (face: ImageRef | undefined) => void;
  onSetRoomMode?: (mode: RoomMode) => void;
  onSetDoorExit?: (exit: DoorExit) => void;
}) {
  const [clearOpen, setClearOpen] = useState(false);
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  const stair = board.stairs.find((s) => s.id === cell?.stairId);
  const catalog = spinners ?? [];

  if (!floor) return null;

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="tile-actions">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-100">Tile Actions</p>
        {cell ? (
          <p className="text-sm text-slate-300" data-testid="tile-actions-kind">
            {cellHeading(cell)}
          </p>
        ) : null}
        {cell && cell.kind !== 'hud' && cell.kind !== 'board' ? (
          <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
            <Button type="button" variant="outline" onClick={() => setClearOpen(true)}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>
      {!cell ? (
        <p className="text-sm text-slate-400">Select a tile to edit pack, stairs, start, or end.</p>
      ) : (
        <>
          {cell.kind === 'board' ? (
            <p className="text-sm text-slate-400">Board tiles are scenery. They are not playable and are not HUD.</p>
          ) : cell.kind === 'hud' ? (
            <>
              <Label htmlFor="hud-type">HUD type</Label>
              <select
                id="hud-type"
                aria-label="HUD type"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={hudWidgetOf(cell)}
                onChange={(e) => onSetHudWidget?.(e.target.value as HudWidget)}
              >
                {HUD_WIDGETS.map((widget) => (
                  <option key={widget} value={widget}>
                    {HUD_TYPE_OPTIONS[widget]}
                  </option>
                ))}
              </select>
            </>
          ) : cell.kind === 'stair' ? (
            <>
              <p className="text-xs text-slate-400">Stair tiles never hold packs.</p>
              {stair ? (
                <p className="text-sm">{stair.legal ? stairLabel(board, stair) : 'Stair has no destination.'}</p>
              ) : null}
              <Label htmlFor="dest-floor">Destination level</Label>
              <select
                id="dest-floor"
                aria-label="Destination level"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={stair?.toFloorId ?? ''}
                onChange={(e) => {
                  const dest = board.floors.find((f) => f.id === e.target.value);
                  const landing = dest?.cells[0]?.id;
                  if (dest && landing) onLinkStair(dest.id, landing);
                }}
              >
                <option value="">Choose floor</option>
                {board.floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <Label htmlFor="dest-cell">Landing tile</Label>
              <select
                id="dest-cell"
                aria-label="Landing tile"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={stair?.toCellId ?? ''}
                onChange={(e) => {
                  if (stair?.toFloorId) onLinkStair(stair.toFloorId, e.target.value);
                }}
              >
                <option value="">Choose tile</option>
                {board.floors
                  .find((f) => f.id === (stair?.toFloorId || board.floors.find((x) => x.id !== floorId)?.id))
                  ?.cells.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
              </select>
            </>
          ) : (
            <>
              {cell.kind === 'door' && onSetDoorExit ? (
                <>
                  <Label htmlFor="door-type">Door type</Label>
                  <select
                    id="door-type"
                    aria-label="Door type"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.doorExit ?? 'leave-or-stay'}
                    onChange={(e) => onSetDoorExit(e.target.value as DoorExit)}
                  >
                    <option value="leave-or-stay">Leave / Stay</option>
                    <option value="auto-leave">Auto-leave</option>
                  </select>
                </>
              ) : null}
              {cell.kind === 'room' && onSetRoomMode ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={(roomById(board, cell.roomId)?.mode ?? 'single') === 'single' ? 'secondary' : 'outline'}
                    onClick={() => onSetRoomMode('single')}
                  >
                    single-tile
                  </Button>
                  <Button
                    type="button"
                    variant={roomById(board, cell.roomId)?.mode === 'multi' ? 'secondary' : 'outline'}
                    onClick={() => onSetRoomMode('multi')}
                  >
                    multi-tile
                  </Button>
                </div>
              ) : null}
              {packIds.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No packs in this draft. Create a pack in Packs, or import a CSV on Imports.
                </p>
              ) : (
                <>
                  <Label htmlFor="cell-pack">Pack</Label>
                  <select
                    id="cell-pack"
                    aria-label="Pack"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.packId ?? ''}
                    onChange={(e) => {
                      const next = e.target.value || undefined;
                      if (onSetDeal) onSetDeal(next, 'draw');
                      else onSetPack(next);
                    }}
                  >
                    <option value="">None</option>
                    {packIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  {cell.packId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={(cell.packMode ?? 'draw') === 'draw' ? 'secondary' : 'outline'}
                        onClick={() => onSetDeal?.(cell.packId, 'draw')}
                      >
                        Draw
                      </Button>
                      <Button
                        type="button"
                        variant={cell.packMode === 'card' ? 'secondary' : 'outline'}
                        onClick={() => onSetDeal?.(cell.packId, 'card', cell.cardId)}
                      >
                        Card
                      </Button>
                    </div>
                  ) : null}
                  {cell.packId && cell.packMode === 'card' ? (
                    <>
                      <Label htmlFor="cell-card">Card</Label>
                      <select
                        id="cell-card"
                        aria-label="Attached card"
                        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                        value={cell.cardId ?? ''}
                        onChange={(e) => onSetDeal?.(cell.packId, 'card', e.target.value || undefined)}
                      >
                        <option value="">Choose card</option>
                        {(cards ?? [])
                          .filter((card) => card.pack === cell.packId)
                          .map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.title}
                            </option>
                          ))}
                      </select>
                    </>
                  ) : null}
                </>
              )}
              {items && items.length > 0 && onSetItem ? (
                <>
                  <Label htmlFor="cell-item">Item</Label>
                  <select
                    id="cell-item"
                    aria-label="Item"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.itemId ?? ''}
                    onChange={(e) => onSetItem(e.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {catalog.length > 0 && onSetSpinner ? (
                <>
                  <Label htmlFor="cell-spinner">Spinner</Label>
                  <select
                    id="cell-spinner"
                    aria-label="Spinner"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.spinnerId ?? ''}
                    onChange={(e) => onSetSpinner(e.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {catalog.map((spinner) => (
                      <option key={spinner.id} value={spinner.id}>
                        {spinner.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </>
          )}
          {cell.kind !== 'hud' && onSetAudio ? (
            <>
              <AudioField
                value={cell.audio}
                gameId={gameId ?? 'draft'}
                media={media}
                onChange={onSetAudio}
                idPrefix={`cell-${cell.id}`}
              />
              {onSetImage ? (
                <MediaField
                  kind="image"
                  label="Image"
                  value={cell.image}
                  gameId={gameId ?? 'draft'}
                  media={media}
                  onChange={(next) => onSetImage(next as ImageRef | undefined)}
                  idPrefix={`cell-${cell.id}`}
                />
              ) : null}
              {onSetImage ? (
                <p className="text-xs text-slate-400">Land / HUD popup — not the 3D face.</p>
              ) : null}
              {onSetFace ? (
                <MediaField
                  kind="image"
                  label="Tile face"
                  value={cell.face}
                  gameId={gameId ?? 'draft'}
                  media={media}
                  onChange={(next) => onSetFace(next as ImageRef | undefined)}
                  idPrefix={`cell-${cell.id}-face`}
                />
              ) : null}
              {onSetVideo ? (
                <MediaField
                  kind="video"
                  value={cell.video}
                  gameId={gameId ?? 'draft'}
                  media={media}
                  onChange={(next) => onSetVideo(next as VideoRef | undefined)}
                  idPrefix={`cell-${cell.id}`}
                />
              ) : null}
            </>
          ) : null}
        </>
      )}
      <LevelConfirmDialog
        open={clearOpen}
        title="Clear this tile?"
        description="This turns the tile back into a standard tile and removes its settings."
        confirmLabel="Clear"
        onOpenChange={setClearOpen}
        onConfirm={() => {
          onClear?.();
          setClearOpen(false);
        }}
      />
    </div>
  );
}
