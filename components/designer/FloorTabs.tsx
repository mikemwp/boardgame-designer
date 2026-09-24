'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Floor } from '@/lib/engine/types';

export function FloorTabs({
  floors,
  selectedFloorId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onRequestDelete,
  onRequestReset,
  resetDisabled = false,
}: {
  floors: Floor[];
  selectedFloorId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  onRename?: (label: string) => void;
  onRequestDelete?: () => void;
  onRequestReset?: () => void;
  resetDisabled?: boolean;
}) {
  const selected = floors.find((floor) => floor.id === selectedFloorId);
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
        onClick={() => (onRequestDelete ?? (() => onDelete?.(selectedFloorId)))()}
      >
        Delete level
      </Button>
      {onRequestReset ? (
        <Button type="button" variant="outline" disabled={resetDisabled} onClick={onRequestReset}>
          Reset level
        </Button>
      ) : null}
      {onRename && selected ? (
        <Input
          id="level-name"
          key={selected.id}
          aria-label="Level name"
          defaultValue={selected.label}
          className="h-8 w-28"
          onBlur={(e) => onRename(e.target.value)}
        />
      ) : null}
    </div>
  );
}
