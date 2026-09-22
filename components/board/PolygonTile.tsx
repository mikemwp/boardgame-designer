'use client';

import { useEffect, useState } from 'react';
import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { useApp } from '@playcanvas/react/hooks';
import { Mesh, MeshInstance, StandardMaterial } from 'playcanvas';
import type { Vec2 } from '@/lib/engine/shape-layout';
import { trapezoidPrism } from '@/lib/view/tile-geometry';

export function PolygonTile({
  id,
  polygon,
  y,
  material,
  position,
}: {
  id: string;
  polygon: Vec2[];
  y: number;
  material: unknown;
  position: [number, number, number];
}) {
  const app = useApp();
  const [meshInstance, setMeshInstance] = useState<MeshInstance | null>(null);

  useEffect(() => {
    if (!app) return;
    const { positions, indices } = trapezoidPrism(polygon, y);
    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setIndices(indices);
    mesh.update();
    const instance = new MeshInstance(mesh, material as StandardMaterial);
    setMeshInstance(instance);
    return () => {
      mesh.destroy();
      setMeshInstance(null);
    };
  }, [app, polygon, y, material]);

  return (
    <Entity
      name={id}
      data-testid={`polygon-tile-${id}` as never}
      position={position}
    >
      {app && meshInstance ? (
        <Render type="asset" asset={meshInstance} />
      ) : app ? (
        <Render type="box" material={material as never} />
      ) : null}
    </Entity>
  );
}
