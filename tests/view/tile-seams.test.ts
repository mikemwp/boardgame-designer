import { describe, it, expect } from 'vitest';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { tileSeamEdges, tileSeamEdgesFromPolygon, TILE_SEAM_WIDTH } from '@/lib/view/tile-seams';

describe('tileSeamEdges', () => {
  it('returns four edge strips around a tile center', () => {
    const edges = tileSeamEdges({ x: 0, y: 0, z: 0 });
    expect(edges).toHaveLength(4);
    expect(edges.every((edge) => edge.scale[0] > 0 && edge.scale[2] > 0)).toBe(true);
    const widths = edges.flatMap((edge) => [edge.scale[0], edge.scale[2]]);
    expect(widths.filter((w) => w === TILE_SEAM_WIDTH)).toHaveLength(4);
  });

  it('returns four polygon edge strips for a wedge', () => {
    const layout = buildShapeLayout({ kind: 'circle', tiles: 8 });
    const edges = tileSeamEdgesFromPolygon(0, layout.slots[0]!.polygon);
    expect(edges).toHaveLength(4);
    expect(edges.some((e) => Math.hypot(e.position[0], e.position[2]) > 1)).toBe(true);
  });

  it('places seams on tile boundaries without shrinking tile spacing', () => {
    const edges = tileSeamEdges({ x: 1, y: 0, z: -1 });
    const xs = edges.map((edge) => edge.position[0]);
    const zs = edges.map((edge) => edge.position[2]);
    expect(xs).toContain(1.5);
    expect(xs).toContain(0.5);
    expect(zs).toContain(-0.5);
    expect(zs).toContain(-1.5);
  });
});
