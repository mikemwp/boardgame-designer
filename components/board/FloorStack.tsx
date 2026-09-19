'use client';

import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { cellToWorld } from '@/lib/view/board-layout';

export function FloorStack({ board }: { board: Board }) {
  return (
    <>
      {board.floors.map((floor) => {
        const pos = cellToWorld(floor.index, 0);
        return (
          <Entity key={floor.id} name={floor.id} position={[pos.x, pos.y, pos.z]}>
            <Render type="box" />
          </Entity>
        );
      })}
    </>
  );
}
