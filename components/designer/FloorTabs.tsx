'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Floor } from '@/lib/engine/types';

export function FloorTabs({
  floors,
  selectedFloorId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: {
  floors: Floor[];
  selectedFloorId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename?: (label: string) => void;
}) {
  const selected = floors.find((f) => f.id === selectedFloorId);
  const selectedLabel = selected?.label ?? 'level';

  return (
    <div className="flex shrink-0 flex-nowrap items-end gap-2">
      {floors.map((floor) => (
        <Button
          key={floor.id}
          type="button"
          variant={floor.id === selectedFloorId ? 'secondary' : 'outline'}
          aria-pressed={floor.id === selectedFloorId}
          onClick={() => onSelect(floor.id)}
        >
          {floor.label}
        </Button>
      ))}
      <Button type="button" variant="outline" onClick={onAdd}>
        Add level
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={floors.length <= 1}
        aria-label={`Delete ${selectedLabel}`}
        onClick={() => onDelete(selectedFloorId)}
      >
        Delete level
      </Button>
      {onRename && selected ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="level-name">Level name</Label>
          <Input
            id="level-name"
            key={selected.id}
            aria-label="Level name"
            defaultValue={selected.label}
            className="h-8 w-28"
            onBlur={(e) => onRename(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
