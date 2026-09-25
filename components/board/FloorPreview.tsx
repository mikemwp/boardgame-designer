'use client';

import { Entity } from '@playcanvas/react';
import { Light } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { previewBoardForFloor } from '@/lib/engine/layout';
import { cellToWorld } from '@/lib/view/board-layout';
import { BoardOrbitCamera } from './BoardOrbitCamera';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';

export function FloorPreview({
  board,
  floorId,
  selectedCellId,
  gameTitle,
}: {
  board: Board;
  floorId: string;
  selectedCellId?: string;
  gameTitle?: string;
}) {
  const preview = previewBoardForFloor(board, floorId);
  const floor = preview.floors[0];
  const bias = floor?.look?.cameraBias ?? 'top-down';
  const standIn = floor?.cells
    .filter((cell) => cell.kind !== 'hud' && cell.col !== undefined)
    .sort((a, b) => (b.row ?? 0) - (a.row ?? 0))[0];
  const token = standIn && floor
    ? cellToWorld(floor.index, standIn, floor.hud, floor)
    : undefined;

  return (
    <div
      className="relative flex h-full min-h-64 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
      data-testid="floor-preview"
    >
      {gameTitle ? (
        <p className="pointer-events-none absolute left-3 top-3 z-10 text-sm text-slate-100" data-testid="surround-game-name">
          {gameTitle}
        </p>
      ) : null}
      <PlayCanvasViewport
        usePhysics={false}
        slotId="design-floor-preview"
        className="relative min-h-64 flex-1 h-full w-full"
      >
        <BoardOrbitCamera board={preview} view="top-down" bias={bias} token={token} />
        <Entity name="sun" rotation={[-55, 40, 0]}>
          <Light type="directional" intensity={1.5} />
        </Entity>
        <Entity name="fill" position={[2, 5, 3]}>
          <Light type="omni" intensity={0.8} />
        </Entity>
        <FloorStack board={preview} selectedCellId={selectedCellId} />
      </PlayCanvasViewport>
    </div>
  );
}
