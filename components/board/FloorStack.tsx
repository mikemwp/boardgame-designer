'use client';

import { Entity } from '@playcanvas/react';
import { Collision, Render, RigidBody } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import type { Board } from '@/lib/engine/board';
import { cellToWorld } from '@/lib/view/board-layout';

export function FloorStack({ board, usePhysics = false }: { board: Board; usePhysics?: boolean }) {
  const material = useMaterial({ diffuse: '#94a3b8', emissive: '#475569', emissiveIntensity: 0.9 });

  return (
    <>
      {board.floors.map((floor) => {
        const pos = cellToWorld(floor.index, 0);
        return (
          <Entity
            key={floor.id}
            name={floor.id}
            position={[pos.x, pos.y, pos.z]}
            scale={[1.6, 0.25, 1.6]}
          >
            <Render type="box" material={material} />
            {usePhysics && (
              <>
                <Collision type="box" halfExtents={[0.75, 0.05, 0.75]} />
                <RigidBody type="static" />
              </>
            )}
          </Entity>
        );
      })}
    </>
  );
}
