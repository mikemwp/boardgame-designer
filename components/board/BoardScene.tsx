'use client';

import { Entity } from '@playcanvas/react';
import { Light } from '@playcanvas/react/components';
import { playCameraBias } from '@/lib/designer/board-look';
import type { GameState } from '@/lib/engine/game';
import { tokenPosToWorld } from '@/lib/view/board-layout';
import { BoardOrbitCamera } from './BoardOrbitCamera';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({
  game,
  usePhysics,
  allowSlide = true,
  onTokenSlideStart,
  onTokenSlideComplete,
  gameTitle,
}: {
  game: GameState;
  usePhysics?: boolean;
  allowSlide?: boolean;
  onTokenSlideStart?: () => void;
  onTokenSlideComplete?: () => void;
  gameTitle?: string;
}) {
  const physicsEnabled = usePhysics ?? false;
  const active = game.players.players.find((player) => player.id === game.players.activePlayerId);
  const floor = game.board.floors.find((entry) => entry.id === active?.token.floorId);
  const bias = playCameraBias(floor?.look);
  const token = active ? tokenPosToWorld(game.board, active.token) : undefined;

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
      data-testid="board-frame"
    >
      {gameTitle ? (
        <p className="pointer-events-none absolute left-3 top-3 z-10 text-sm text-slate-100" data-testid="surround-game-name">
          {gameTitle}
        </p>
      ) : null}
      <PlayCanvasViewport usePhysics={physicsEnabled} slotId="test-board-scene">
        <BoardOrbitCamera board={game.board} view="top-down" bias={bias} token={token} />
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
          allowSlide={allowSlide}
          onSlideStart={onTokenSlideStart}
          onSlideComplete={onTokenSlideComplete}
        />
      </PlayCanvasViewport>
    </div>
  );
}
