'use client';

import { Application, Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import { FILLMODE_KEEP_ASPECT } from 'playcanvas';
import type { GameState } from '@/lib/engine/game';
import { DiceRollLayer } from './DiceRollLayer';
import { FloorStack } from './FloorStack';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({ game, usePhysics }: { game: GameState; usePhysics?: boolean }) {
  const physicsEnabled = usePhysics ?? game.config.diceEnabled;

  return (
    <div className="relative h-[480px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      <Application
        usePhysics={physicsEnabled}
        fillMode={FILLMODE_KEEP_ASPECT}
        className="block h-full w-full"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Entity name="camera" position={[0, 4, 9]} rotation={[-18, 0, 0]}>
          <Camera clearColor="#0f172a" fov={45} nearClip={0.1} farClip={100} />
        </Entity>
        <Entity name="sun" rotation={[-50, 35, 0]}>
          <Light type="directional" intensity={1.25} />
        </Entity>
        <Entity name="fill" position={[0, 6, 4]}>
          <Light type="omni" intensity={0.35} />
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
