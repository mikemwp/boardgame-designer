import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';
import { normalizeShape } from '@/lib/engine/shape';

describe('BoardShapeFields', () => {
  it('keeps board shape and tile fields on one horizontal row', () => {
    const { container } = render(
      <BoardShapeFields
        shape={normalizeShape({ kind: 'hub-spoke-wheel', hubTiles: 8, spokeCount: 4, spokeTiles: 2, wheelTiles: 12 })}
        onChange={() => {}}
      />,
    );
    const row = screen.getByTestId('board-shape-fields');
    expect(row.className).toMatch(/flex-row/);
    expect(row.className).toMatch(/flex-wrap/);
    expect(row.contains(screen.getByLabelText('Board shape'))).toBe(true);
    for (const label of ['Hub tiles', 'Spokes', 'Spoke tiles', 'Wheel tiles']) {
      expect(row.textContent).toContain(label);
    }
    expect(container.querySelectorAll('[data-testid="board-shape-fields"] > *').length).toBeGreaterThan(1);
  });
});
