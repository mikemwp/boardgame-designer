'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RoomDef } from '@/lib/engine/types';

export function RoomTabs({
  rooms,
  selectedRoomId,
  onSelect,
  onRename,
  onRequestReset,
  onRequestDelete,
  resetDisabled = false,
}: {
  rooms: RoomDef[];
  selectedRoomId: string | null;
  onSelect: (id: string) => void;
  onRename?: (name: string) => void;
  onRequestReset?: () => void;
  onRequestDelete?: () => void;
  resetDisabled?: boolean;
}) {
  const visible = rooms.filter((room) => room.mode === 'multi');
  const selected = visible.find((room) => room.id === selectedRoomId) ?? visible[0];
  if (visible.length === 0) return null;

  return (
    <div className="flex min-h-10 shrink-0 flex-nowrap items-end gap-2">
      {visible.map((room) => (
        <Button
          key={room.id}
          type="button"
          variant={room.id === selectedRoomId ? 'secondary' : 'outline'}
          aria-pressed={room.id === selectedRoomId}
          onClick={() => onSelect(room.id)}
        >
          {room.name}
        </Button>
      ))}
      {onRequestReset ? (
        <Button type="button" variant="outline" disabled={resetDisabled} onClick={onRequestReset}>
          Reset room
        </Button>
      ) : null}
      {onRequestDelete ? (
        <Button type="button" variant="ghost" onClick={onRequestDelete}>
          Delete room
        </Button>
      ) : null}
      {onRename && selected ? (
        <Input
          id="room-name"
          key={selected.id}
          aria-label="Room name"
          defaultValue={selected.name}
          className="h-8 w-28"
          onBlur={(e) => onRename(e.target.value)}
        />
      ) : null}
    </div>
  );
}
