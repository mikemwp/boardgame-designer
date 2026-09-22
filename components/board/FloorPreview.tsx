'use client';

import { Entity } from '@playcanvas/react';
import { Light } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { previewBoardForFloor } from '@/lib/engine/layout';
import { BoardOrbitCamera } from './BoardOrbitCamera';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';

export function FloorPreview({
  board,
  floorId,
  selectedCellId,
}: {
  board: Board;
  floorId: string;
  selectedCellId?: string;
}) {
  const preview = previewBoardForFloor(board, floorId);

  return (
    <div
      className="flex h-full min-h-64 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
      data-testid="floor-preview"
    >
      <PlayCanvasViewport
        usePhysics={false}
        slotId="design-floor-preview"
        className="relative min-h-64 flex-1 h-full w-full"
      >
        <BoardOrbitCamera board={preview} view="top-down" />
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
