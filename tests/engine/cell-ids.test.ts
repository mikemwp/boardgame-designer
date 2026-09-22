import { describe, it, expect } from 'vitest';
import { cellIdsAreUnique, uniquifyCellIds } from '@/lib/engine/cell-ids';
import type { Cell } from '@/lib/engine/types';

function cell(id: string, col: number, row: number): Cell {
  return { id, index: 0, kind: 'corridor', col, row };
}

describe('uniquifyCellIds', () => {
  it('remints a leftover floor-1-c24 that collides with the rebuilt ring', () => {
    const cells = [
      cell('floor-1-c0', 0, 0),
      cell('floor-1-c24', 0, 6),
      cell('floor-1-c24', 1, 1),
    ];
    const next = uniquifyCellIds('floor-1', cells);
    expect(cellIdsAreUnique(next)).toBe(true);
    expect(next[1]?.id).toBe('floor-1-c24');
    expect(next[2]?.id).not.toBe('floor-1-c24');
  });
});
