'use client';

import { Application, Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import { FILLMODE_FILL_WINDOW } from 'playcanvas';
import type { GameState } from '@/lib/engine/game';
import { DiceRollLayer } from './DiceRollLayer';
import { FloorStack } from './FloorStack';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({ game, usePhysics }: { game: GameState; usePhysics?: boolean }) {
  const physicsEnabled = usePhysics ?? game.config.diceEnabled;

  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800">
      <Application usePhysics={physicsEnabled} fillMode={FILLMODE_FILL_WINDOW}>
        <Entity name="camera" position={[4, 5, 10]} rotation={[-20, 0, 0]}>
          <Camera fov={45} nearClip={0.1} farClip={100} />
        </Entity>
        <Entity name="sun" rotation={[-45, 30, 0]}>
          <Light type="directional" intensity={1.2} />
        </Entity>
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
