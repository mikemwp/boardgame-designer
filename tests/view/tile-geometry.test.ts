import { describe, it, expect } from 'vitest';
import { createLoopedFloor } from '@/lib/engine/layout';
import { buildShapeLayout } from '@/lib/engine/shape-layout';
import { cellToWorld } from '@/lib/view/board-layout';
import { trapezoidPrism } from '@/lib/view/tile-geometry';

describe('trapezoidPrism', () => {
  it('builds a prism whose inner top edge is the flat chord', () => {
    const layout = buildShapeLayout({ kind: 'circle', tiles: 8 });
    const poly = layout.slots[0]!.polygon;
    const mesh = trapezoidPrism(poly, 0);
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.indices.length % 3).toBe(0);
  });

  it('places a circle cell at the trapezoid centroid, not the origin', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 8 });
    const world = cellToWorld(0, floor.cells[0]!, floor.hud, floor);
    expect(Math.hypot(world.x, world.z)).toBeGreaterThan(1);
  });
});
