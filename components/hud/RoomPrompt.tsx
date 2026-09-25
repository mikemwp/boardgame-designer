'use client';

import { Button } from '@/components/ui/button';

export function RoomPrompt({
  awaitingRoom,
  awaitingDoorExit = false,
  canLeave,
  onEnter,
  onPass,
  onLeave,
  onStay,
}: {
  awaitingRoom: boolean;
  awaitingDoorExit?: boolean;
  canLeave: boolean;
  onEnter: () => void;
  onPass: () => void;
  onLeave: () => void;
  onStay?: () => void;
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
  if (awaitingDoorExit) {
    return (
      <div className="flex flex-wrap gap-2" data-testid="room-prompt">
        <Button type="button" onClick={onLeave}>
          Leave
        </Button>
        <Button type="button" variant="outline" onClick={onStay}>
          Stay
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
