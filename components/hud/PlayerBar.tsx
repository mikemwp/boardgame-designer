'use client';

import { Badge } from '@/components/ui/badge';
import type { Player } from '@/lib/engine/types';

export function PlayerBar({
  players,
  activePlayerId,
}: {
  players: Player[];
  activePlayerId: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player) => (
        <Badge
          key={player.id}
          variant={player.id === activePlayerId ? 'default' : 'secondary'}
        >
          {player.name}
        </Badge>
      ))}
    </div>
  );
}
