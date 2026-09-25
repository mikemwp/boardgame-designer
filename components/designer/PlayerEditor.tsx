'use client';

import { Label } from '@/components/ui/label';
import type { InventoryItem, ItemAssign } from '@/lib/engine/types';

export function PlayerEditor({
  items,
  itemAssign,
  selectedId,
  onSelect,
  onStarting,
  onAssign,
}: {
  items: InventoryItem[];
  itemAssign: ItemAssign;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onStarting: (starting: boolean) => void;
  onAssign: (mode: ItemAssign) => void;
}) {
  const selected = items.find((item) => item.id === selectedId);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="player-editor">
      <p className="text-sm font-medium text-slate-100">Players</p>
      <Label htmlFor="item-assign">Starting items</Label>
      <select
        id="item-assign"
        aria-label="Starting items"
        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
        value={itemAssign}
        onChange={(e) => onAssign(e.target.value as ItemAssign)}
      >
        <option value="random">Randomly assign</option>
        <option value="choose">Players choose</option>
      </select>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Create items on the Items tab.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-label={`Select item ${item.name}`}
                aria-pressed={selectedId === item.id}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm ${
                  selectedId === item.id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                }`}
                onClick={() => onSelect(item.id)}
              >
                <span>{item.name}</span>
                {item.starting ? <span className="text-xs text-slate-400">start</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            aria-label="Starting item"
            checked={Boolean(selected.starting)}
            onChange={(e) => onStarting(e.target.checked)}
          />
          Starting item
        </label>
      ) : null}
    </div>
  );
}
