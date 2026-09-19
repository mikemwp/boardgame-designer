'use client';

import { Application } from '@playcanvas/react';
import type { GameState } from '@/lib/engine/game';
import { FloorStack } from './FloorStack';

export function BoardScene({ game, usePhysics = false }: { game: GameState; usePhysics?: boolean }) {
  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800">
      <Application usePhysics={usePhysics}>
        <FloorStack board={game.board} />
      </Application>
    </div>
  );
}
