'use client';

import { Entity } from '@playcanvas/react';
import { Collision, Render, RigidBody } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import type { Board } from '@/lib/engine/board';
import { cellToWorld } from '@/lib/view/board-layout';

export function FloorStack({ board, usePhysics = false }: { board: Board; usePhysics?: boolean }) {
  const corridorMat = useMaterial({ diffuse: '#94a3b8', emissive: '#475569', emissiveIntensity: 0.9 });
  const stairMat = useMaterial({ diffuse: '#f59e0b', emissive: '#b45309', emissiveIntensity: 0.8 });

  return (
    <>
      {board.floors.flatMap((floor) =>
        floor.cells.map((cell) => {
          const pos = cellToWorld(floor.index, cell.index, floor.cells.length);
          const stair = cell.kind === 'stair';
          return (
            <Entity
              key={cell.id}
              name={cell.id}
              position={[pos.x, pos.y, pos.z]}
              scale={[1.1, 0.2, 1.1]}
            >
              <Render type="box" material={stair ? stairMat : corridorMat} />
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
