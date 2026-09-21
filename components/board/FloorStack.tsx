'use client';

import { Entity } from '@playcanvas/react';
import { Collision, Render, RigidBody } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import type { Board } from '@/lib/engine/board';
import { cellToWorld } from '@/lib/view/board-layout';

export function FloorStack({
  board,
  usePhysics = false,
  selectedCellId,
}: {
  board: Board;
  usePhysics?: boolean;
  selectedCellId?: string;
}) {
  const corridorMat = useMaterial({ diffuse: '#94a3b8', emissive: '#475569', emissiveIntensity: 0.9 });
  const stairMat = useMaterial({ diffuse: '#f59e0b', emissive: '#b45309', emissiveIntensity: 0.8 });
  const selectedMat = useMaterial({ diffuse: '#38bdf8', emissive: '#0369a1', emissiveIntensity: 0.9 });

  return (
    <>
      {board.floors.flatMap((floor) =>
        floor.cells.map((cell) => {
          const pos = cellToWorld(floor.index, cell, floor.hud);
          const stair = cell.kind === 'stair';
          const selected = cell.id === selectedCellId;
          const material = selected ? selectedMat : stair ? stairMat : corridorMat;
          return (
            <Entity
              key={cell.id}
              name={cell.id}
              position={[pos.x, pos.y, pos.z]}
              scale={[1, 0.2, 1]}
            >
              <Render type="box" material={material} />
              {usePhysics && (
                <>
                  <Collision type="box" halfExtents={[0.5, 0.05, 0.5]} />
                  <RigidBody type="static" />
                </>
              )}
            </Entity>
          );
        }),
      )}
    </>
  );
}
