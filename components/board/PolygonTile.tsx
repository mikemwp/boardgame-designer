'use client';

import { useEffect, useState } from 'react';
import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { useApp } from '@playcanvas/react/hooks';
import { Mesh, MeshInstance, StandardMaterial } from 'playcanvas';
import type { Vec2 } from '@/lib/engine/shape-layout';
import { polygonCentroid, trapezoidPrism } from '@/lib/view/tile-geometry';

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
    const centroid = polygonCentroid(polygon);
    const localPolygon = polygon.map((p) => ({
      x: p.x - centroid.x,
      z: p.z - centroid.z,
    }));
    const { positions, indices } = trapezoidPrism(localPolygon, 0);
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
  }, [app, polygon, material]);

  return (
    <Entity
      name={id}
      data-testid={`polygon-tile-${id}` as never}
      position={position}
    >
      {meshInstance ? <Render meshInstances={[meshInstance]} /> : null}
    </Entity>
  );
}
