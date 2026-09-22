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
