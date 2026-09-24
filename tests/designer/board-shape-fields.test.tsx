import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';
import { normalizeShape } from '@/lib/engine/shape';

describe('BoardShapeFields', () => {
  it('shows only square and rectangle in the board shape dropdown', () => {
    render(
      <BoardShapeFields shape={normalizeShape({ kind: 'square', tilesPerSide: 8 })} onChange={() => {}} />,
    );
    const select = screen.getByLabelText('Shape') as HTMLSelectElement;
    const labels = Array.from(select.options).map((opt) => opt.textContent);
    expect(labels).toEqual(['Square', 'Rectangle']);
  });

  it('uses a Tiles size picker for square boards', () => {
    render(
      <BoardShapeFields shape={normalizeShape({ kind: 'square', tilesPerSide: 8 })} onChange={() => {}} />,
    );
    const tiles = screen.getByLabelText('Tiles') as HTMLSelectElement;
    expect(Array.from(tiles.options).map((opt) => opt.textContent)).toEqual([
      '3×3',
      '4×4',
      '5×5',
      '6×6',
      '7×7',
      '8×8',
      '9×9',
      '10×10',
      '11×11',
      '12×12',
    ]);
    expect(screen.queryByText('Tiles per side')).toBeNull();
  });

  it('keeps board shape and tile fields on one horizontal row', () => {
    const { container } = render(
      <BoardShapeFields
        shape={normalizeShape({ kind: 'hub-spoke-wheel', hubTiles: 8, spokeCount: 4, spokeTiles: 2, wheelTiles: 12 })}
        onChange={() => {}}
      />,
    );
    const row = screen.getByTestId('board-shape-fields');
    expect(row.className).toMatch(/flex-nowrap/);
    expect(row.className.split(/\s+/).includes('flex-wrap')).toBe(false);
    expect(row.contains(screen.getByLabelText('Shape'))).toBe(true);
    for (const label of ['Hub tiles', 'Spokes', 'Spoke tiles', 'Wheel tiles']) {
      expect(row.textContent).toContain(label);
    }
    expect(container.querySelectorAll('[data-testid="board-shape-fields"] > *').length).toBeGreaterThan(1);
  });

  it('caps room Shape/Tiles at square 4 and rectangle 5×4', () => {
    render(
      <BoardShapeFields
        shape={normalizeShape({ kind: 'square', tilesPerSide: 3 })}
        maxSquare={4}
        maxRect={{ length: 5, width: 4 }}
        onChange={() => {}}
      />,
    );
    expect(Array.from((screen.getByLabelText('Tiles') as HTMLSelectElement).options).map((opt) => opt.textContent)).toEqual([
      '3×3',
      '4×4',
    ]);
  });

  it('disables Shape and Tiles when locked', () => {
    render(
      <BoardShapeFields
        shape={normalizeShape({ kind: 'square', tilesPerSide: 8 })}
        disabled
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Shape')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Tiles')).toHaveProperty('disabled', true);
  });
});
