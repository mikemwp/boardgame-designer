'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import type { GameState } from '@/lib/engine/game';
import { DiceRollLayer } from './DiceRollLayer';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({ game, usePhysics }: { game: GameState; usePhysics?: boolean }) {
  const physicsEnabled = usePhysics ?? game.config.diceEnabled;

  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      <PlayCanvasViewport usePhysics={physicsEnabled}>
        <Entity name="camera" position={[0, 3.5, 7]} rotation={[-22, 0, 0]}>
          <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
        </Entity>
        <Entity name="sun" rotation={[-55, 40, 0]}>
          <Light type="directional" intensity={1.5} />
        </Entity>
        <Entity name="fill" position={[2, 5, 3]}>
          <Light type="omni" intensity={0.8} />
        </Entity>
        <FloorStack board={game.board} usePhysics={physicsEnabled} />
        <PlayerTokens
          board={game.board}
          players={game.players.players}
          lastEvent={game.lastEvent}
        />
        <DiceRollLayer enabled={game.config.diceEnabled} lastEvent={game.lastEvent} />
      </PlayCanvasViewport>
    </div>
  );
}
