import type { Vec2 } from '@/lib/engine/shape-layout';
import type { Vec3 } from '@/lib/view/board-layout';

export const TILE_SEAM_WIDTH = 0.04;
const TILE_TOP_OFFSET = 0.11;
const SEAM_HEIGHT = 0.02;

export interface TileSeamEdge {
  position: [number, number, number];
  scale: [number, number, number];
}

export function tileSeamEdges(center: Vec3): TileSeamEdge[] {
  const y = center.y + TILE_TOP_OFFSET;
  const w = TILE_SEAM_WIDTH;
  const h = SEAM_HEIGHT;
  return [
    { position: [center.x, y, center.z + 0.5], scale: [1, h, w] },
    { position: [center.x, y, center.z - 0.5], scale: [1, h, w] },
    { position: [center.x + 0.5, y, center.z], scale: [w, h, 1] },
    { position: [center.x - 0.5, y, center.z], scale: [w, h, 1] },
  ];
}

export function tileSeamEdgesFromPolygon(centerY: number, polygon: Vec2[]): TileSeamEdge[] {
  const y = centerY + TILE_TOP_OFFSET;
  const h = SEAM_HEIGHT;
  const edges: TileSeamEdge[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const alongX = Math.abs(dx) >= Math.abs(dz);
    edges.push({
      position: [mx, y, mz],
      scale: alongX ? [length, h, TILE_SEAM_WIDTH] : [TILE_SEAM_WIDTH, h, length],
    });
  }
  return edges;
}
