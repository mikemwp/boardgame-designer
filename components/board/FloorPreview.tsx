'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { previewBoardForFloor } from '@/lib/engine/layout';
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
      className="h-[280px] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 md:h-[360px]"
      data-testid="floor-preview"
    >
      <PlayCanvasViewport usePhysics={false}>
        <Entity name="camera" position={[0, 7, 10]} rotation={[-32, 0, 0]}>
          <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
        </Entity>
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
