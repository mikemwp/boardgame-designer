'use client';

import { Application } from '@playcanvas/react';
import type { GameState } from '@/lib/engine/game';
import { DiceRollLayer } from './DiceRollLayer';
import { FloorStack } from './FloorStack';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({ game, usePhysics }: { game: GameState; usePhysics?: boolean }) {
  const physicsEnabled = usePhysics ?? game.config.diceEnabled;

  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800">
      <Application usePhysics={physicsEnabled}>
        <FloorStack board={game.board} usePhysics={physicsEnabled} />
        <PlayerTokens
          board={game.board}
          players={game.players.players}
          lastEvent={game.lastEvent}
        />
        <DiceRollLayer enabled={game.config.diceEnabled} lastEvent={game.lastEvent} />
      </Application>
    </div>
  );
}
