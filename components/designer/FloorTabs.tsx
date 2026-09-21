'use client';

import { Button } from '@/components/ui/button';
import type { Floor } from '@/lib/engine/types';

export function FloorTabs({
  floors,
  selectedFloorId,
  onSelect,
  onAdd,
  onDelete,
}: {
  floors: Floor[];
  selectedFloorId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const selected = floors.find((f) => f.id === selectedFloorId);
  const selectedLabel = selected?.label ?? 'floor';

  return (
    <div className="flex flex-wrap items-center gap-2">
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
        Add floor
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={floors.length <= 1}
        aria-label={`Delete ${selectedLabel}`}
        onClick={() => onDelete(selectedFloorId)}
      >
        Delete floor
      </Button>
    </div>
  );
}
