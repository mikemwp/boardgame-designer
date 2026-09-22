import { describe, it, expect } from 'vitest';
import { buildShapeLayout, isHudSlotInLayout } from '@/lib/engine/shape-layout';

describe('square layout', () => {
  it('builds an 8×8 looping ring on a padded 10×10 grid', () => {
    const layout = buildShapeLayout({ kind: 'square', tilesPerSide: 8 });
    expect(layout.columns).toBe(10);
    expect(layout.rows).toBe(10);
    expect(layout.slots).toHaveLength(28);
    expect(layout.hud).toEqual({ col: 2, row: 2, width: 6, height: 6 });
    expect(layout.slots.every((s) => s.region === 'ring')).toBe(true);
    const first = layout.slots[0]!;
    const last = layout.slots[27]!;
    expect(last.nextId).toBe(first.id);
    expect(first.prevId).toBe(last.id);
    expect(isHudSlotInLayout(layout, 4, 4)).toBe(true);
    expect(isHudSlotInLayout(layout, first.col!, first.row!)).toBe(false);
    expect(isHudSlotInLayout(layout, 0, 0)).toBe(false);
  });

  it('loops a 3×3 square with 8 cells', () => {
    const layout = buildShapeLayout({ kind: 'square', tilesPerSide: 3 });
    expect(layout.columns).toBe(5);
    expect(layout.slots).toHaveLength(8);
    expect(layout.slots[7]!.nextId).toBe(layout.slots[0]!.id);
  });
});

describe('rectangle layout', () => {
  it('builds an 8×6 loop that is not a square', () => {
    const layout = buildShapeLayout({ kind: 'rectangle', length: 8, width: 6 });
    expect(layout.columns).toBe(10);
    expect(layout.rows).toBe(8);
    expect(layout.slots).toHaveLength(24);
    const cols = new Set(layout.slots.map((s) => s.col));
    const rows = new Set(layout.slots.map((s) => s.row));
    expect(Math.max(...cols) - Math.min(...cols) + 1).toBe(8);
    expect(Math.max(...rows) - Math.min(...rows) + 1).toBe(6);
    expect(layout.slots[23]!.nextId).toBe(layout.slots[0]!.id);
  });
});

describe('circle layout', () => {
  it('builds N looping wedges whose inner edge is flat, not pointed', () => {
    const layout = buildShapeLayout({ kind: 'circle', tiles: 12 });
    expect(layout.slots).toHaveLength(12);
    expect(layout.slots[11]!.nextId).toBe(layout.slots[0]!.id);
    for (const slot of layout.slots) {
      expect(slot.polygon).toHaveLength(4);
      expect(slot.region).toBe('ring');
      const inner = [slot.polygon[0]!, slot.polygon[1]!];
      const innerDist = inner.map((p) => Math.hypot(p.x, p.z));
      expect(innerDist[0]).toBeGreaterThan(1);
      expect(innerDist[1]).toBeGreaterThan(1);
      expect(Math.abs(innerDist[0]! - innerDist[1]!)).toBeLessThan(1e-6);
      const mid = {
        x: (inner[0]!.x + inner[1]!.x) / 2,
        z: (inner[0]!.z + inner[1]!.z) / 2,
      };
      expect(Math.hypot(mid.x, mid.z)).toBeGreaterThan(1);
      expect(inner.some((p) => Math.hypot(p.x, p.z) < 0.2)).toBe(false);
    }
  });
});

describe('hub/spoke layout', () => {
  it('loops the hub and leaves spoke ends non-looping', () => {
    const layout = buildShapeLayout({
      kind: 'hub-spoke',
      hubTiles: 12,
      spokeCount: 4,
      spokeTiles: 6,
    });
    const hub = layout.slots.filter((s) => s.region === 'hub');
    const spokes = layout.slots.filter((s) => s.region === 'spoke');
    expect(hub).toHaveLength(12);
    expect(spokes).toHaveLength(24);
    expect(hub[11]!.nextId).toBe(hub[0]!.id);
    const attachments = hub.filter((s) => s.branchId);
    expect(attachments).toHaveLength(4);
    const ends = spokes.filter((s) => s.end);
    expect(ends).toHaveLength(4);
    expect(ends.every((s) => !s.nextId)).toBe(true);
    expect(ends.every((s) => Boolean(s.prevId))).toBe(true);
  });
});

describe('hub/spoke/wheel layout', () => {
  it('loops hub and wheel and bridges them with spokes', () => {
    const layout = buildShapeLayout({
      kind: 'hub-spoke-wheel',
      hubTiles: 8,
      spokeCount: 4,
      spokeTiles: 4,
      wheelTiles: 16,
    });
    const hub = layout.slots.filter((s) => s.region === 'hub');
    const spokes = layout.slots.filter((s) => s.region === 'spoke');
    const wheel = layout.slots.filter((s) => s.region === 'wheel');
    expect(hub).toHaveLength(8);
    expect(spokes).toHaveLength(16);
    expect(wheel).toHaveLength(16);
    expect(hub[7]!.nextId).toBe(hub[0]!.id);
    expect(wheel[15]!.nextId).toBe(wheel[0]!.id);
    expect(spokes.every((s) => !s.end)).toBe(true);
    const lastSpokes = spokes.filter((s) => s.slot === 3);
    expect(lastSpokes).toHaveLength(4);
    expect(lastSpokes.every((s) => s.nextId?.startsWith('wheel-'))).toBe(true);
    expect(wheel.filter((s) => s.branchId)).toHaveLength(4);
  });
});
