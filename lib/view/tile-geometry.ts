import type { Vec2 } from '@/lib/engine/shape-layout';

export interface PrismMesh {
  positions: number[];
  indices: number[];
  normals: number[];
}

export function polygonCentroid(polygon: Vec2[]): Vec2 {
  if (polygon.length === 0) return { x: 0, z: 0 };
  const sum = polygon.reduce(
    (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / polygon.length, z: sum.z / polygon.length };
}

export function trapezoidPrism(polygon: Vec2[], y: number, thickness = 0.2): PrismMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const topY = y;
  const bottomY = y - thickness;
  const n = polygon.length;

  for (let i = 0; i < n; i += 1) {
    const p = polygon[i]!;
    positions.push(p.x, topY, p.z);
    positions.push(p.x, bottomY, p.z);
  }

  for (let i = 1; i < n - 1; i += 1) {
    indices.push(0, i * 2, (i + 1) * 2);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }

  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    const t0 = i * 2;
    const t1 = next * 2;
    const b0 = i * 2 + 1;
    const b1 = next * 2 + 1;
    indices.push(t0, b0, t1, t1, b0, b1);
  }

  return { positions, indices, normals };
}
