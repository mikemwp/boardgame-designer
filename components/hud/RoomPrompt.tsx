'use client';

import { Button } from '@/components/ui/button';

export function RoomPrompt({
  awaitingRoom,
  canLeave,
  onEnter,
  onPass,
  onLeave,
}: {
  awaitingRoom: boolean;
  canLeave: boolean;
  onEnter: () => void;
  onPass: () => void;
  onLeave: () => void;
}) {
  if (awaitingRoom) {
    return (
      <div className="flex flex-wrap gap-2" data-testid="room-prompt">
        <Button type="button" onClick={onEnter}>
          Enter
        </Button>
        <Button type="button" variant="outline" onClick={onPass}>
          Pass
        </Button>
      </div>
    );
  }
  if (canLeave) {
    return (
      <div className="flex flex-wrap gap-2" data-testid="room-prompt">
        <Button type="button" onClick={onLeave}>
          Leave
        </Button>
      </div>
    );
  }
  return null;
}
