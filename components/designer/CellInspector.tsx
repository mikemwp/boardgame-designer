'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Board } from '@/lib/engine/board';
import { stairLabel } from '@/lib/engine/layout';
import type { Cell } from '@/lib/engine/types';

function endTileLabel(cell: Cell): string {
  if (cell.kind === 'stair') return 'End stair';
  if (cell.region === 'hub') return 'End room';
  return 'End tile';
}

export function CellInspector({
  board,
  floorId,
  cellId,
  packIds,
  onRenameFloor,
  onSetPack,
  onSetStart,
  onSetEnd,
  onAttachStair,
  onLinkStair,
  onClearStair,
}: {
  board: Board;
  floorId: string;
  cellId: string | null;
  packIds: string[];
  onRenameFloor: (label: string) => void;
  onSetPack: (packId: string | undefined) => void;
  onSetStart: () => void;
  onSetEnd: () => void;
  onAttachStair: () => void;
  onLinkStair: (toFloorId: string, toCellId: string) => void;
  onClearStair: () => void;
}) {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  const stair = board.stairs.find((s) => s.id === cell?.stairId);

  if (!floor) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="floor-name">Floor name</Label>
        <Input
          id="floor-name"
          aria-label="Floor name"
          defaultValue={floor.label}
          onBlur={(e) => onRenameFloor(e.target.value)}
        />
      </div>
      {!cell ? (
        <p className="text-sm text-slate-400">Select a tile to edit pack, stairs, start, or end.</p>
      ) : (
        <>
          <p className="text-sm text-slate-300">{cell.kind === 'stair' ? 'Stair' : 'Tile'}</p>
          {cell.kind === 'stair' ? (
            <>
              <p className="text-xs text-slate-400">Stair tiles never hold packs.</p>
              {stair ? (
                <p className="text-sm">{stair.legal ? stairLabel(board, stair) : 'Stair has no destination.'}</p>
              ) : null}
              <Label htmlFor="dest-floor">Destination floor</Label>
              <select
                id="dest-floor"
                aria-label="Destination floor"
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
              <Button type="button" variant="outline" onClick={onClearStair}>
                Convert to tile
              </Button>
            </>
          ) : (
            <>
              {packIds.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No packs in this draft. Open Test and import cards, then attach a pack here.
                </p>
              ) : (
                <>
                  <Label htmlFor="cell-pack">Pack</Label>
                  <select
                    id="cell-pack"
                    aria-label="Pack"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.packId ?? ''}
                    onChange={(e) => onSetPack(e.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {packIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <Button type="button" variant="outline" onClick={onAttachStair}>
                Make stair
              </Button>
            </>
          )}
          <Button type="button" onClick={onSetStart}>
            Start tile
          </Button>
          <Button type="button" variant="outline" onClick={onSetEnd}>
            {endTileLabel(cell)}
          </Button>
        </>
      )}
    </div>
  );
}
