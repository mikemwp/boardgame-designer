'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import type { GameState } from '@/lib/engine/game';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({
  game,
  usePhysics,
  onTokenSlideStart,
  onTokenSlideComplete,
}: {
  game: GameState;
  usePhysics?: boolean;
  onTokenSlideStart?: () => void;
  onTokenSlideComplete?: () => void;
}) {
  const physicsEnabled = usePhysics ?? false;

  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      <PlayCanvasViewport usePhysics={physicsEnabled}>
        <Entity name="camera" position={[0, 7, 10]} rotation={[-32, 0, 0]}>
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
          lastRoll={game.lastRoll}
          onSlideStart={onTokenSlideStart}
          onSlideComplete={onTokenSlideComplete}
        />
      </PlayCanvasViewport>
    </div>
  );
}
