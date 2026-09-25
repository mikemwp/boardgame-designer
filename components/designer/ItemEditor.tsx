'use client';

import { AudioField, MediaField } from '@/components/designer/AudioField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AudioRef, ImageRef, InventoryItem, VideoRef } from '@/lib/engine/types';
import type { MediaStore } from '@/lib/library/media-store';

export function ItemEditor({
  items,
  selectedId,
  onSelect,
  onCreate,
  onChange,
  onDelete,
  gameId,
  media,
}: {
  items: InventoryItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onChange: (patch: Partial<InventoryItem>) => void;
  onDelete: () => void;
  gameId?: string;
  media?: MediaStore;
}) {
  const selected = items.find((item) => item.id === selectedId);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="item-editor">
      <p className="text-sm font-medium text-slate-100">Items</p>
      <Button type="button" variant="outline" onClick={onCreate}>
        New item
      </Button>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">
          No items yet. Create named items, then mark starting ones on Players or link them to a tile or card.
        </p>
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
        <>
          <Label htmlFor="item-title">Title</Label>
          <Input
            id="item-title"
            aria-label="Title"
            value={selected.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Label htmlFor="item-description">Description</Label>
          <Input
            id="item-description"
            aria-label="Description"
            value={selected.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
          <Label htmlFor="item-usage-notes">Usage notes</Label>
          <Input
            id="item-usage-notes"
            aria-label="Usage notes"
            value={selected.usageNotes ?? ''}
            onChange={(e) => onChange({ usageNotes: e.target.value })}
          />
          <Label htmlFor="item-uses">Uses remaining</Label>
          <Input
            id="item-uses"
            aria-label="Uses remaining"
            type="number"
            min={1}
            value={selected.usesRemaining ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({ usesRemaining: raw === '' ? 0 : Number(raw) });
            }}
          />
          <p className="text-xs text-slate-400">Empty means unlimited. The game destroys the item when uses hit 0.</p>
          {gameId && media ? (
            <>
              <AudioField
                value={selected.audio}
                gameId={gameId}
                media={media}
                onChange={(audio) => onChange({ audio: audio as AudioRef | undefined })}
                idPrefix={`item-${selected.id}`}
              />
              <MediaField
                kind="image"
                label="Image"
                value={selected.image}
                gameId={gameId}
                media={media}
                onChange={(image) => onChange({ image: image as ImageRef | undefined })}
                idPrefix={`item-${selected.id}`}
              />
              <MediaField
                kind="video"
                value={selected.video}
                gameId={gameId}
                media={media}
                onChange={(video) => onChange({ video: video as VideoRef | undefined })}
                idPrefix={`item-${selected.id}`}
              />
            </>
          ) : null}
          <Button type="button" variant="outline" onClick={onDelete}>
            Delete item
          </Button>
        </>
      ) : null}
    </div>
  );
}
