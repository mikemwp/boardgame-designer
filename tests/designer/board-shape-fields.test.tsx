import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardShapeFields } from '@/components/designer/BoardShapeFields';

describe('BoardShapeFields', () => {
  it('shows shape labels without hovering and emits a circle default', () => {
    const onChange = vi.fn();
    render(<BoardShapeFields shape={{ kind: 'square', tilesPerSide: 8 }} onChange={onChange} />);
    expect(screen.getByText('Board shape')).toBeDefined();
    expect(screen.getByText('Tiles per side')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Board shape'), { target: { value: 'circle' } });
    expect(onChange).toHaveBeenCalledWith({ kind: 'circle', tiles: 12 });
  });

  it('shows hub/spoke fields and wheel when selected', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <BoardShapeFields
        shape={{ kind: 'hub-spoke', hubTiles: 12, spokeCount: 4, spokeTiles: 6 }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Hub tiles')).toBeDefined();
    expect(screen.getByText('Spokes')).toBeDefined();
    expect(screen.getByText('Spoke tiles')).toBeDefined();
    expect(screen.queryByText('Wheel tiles')).toBeNull();
    rerender(
      <BoardShapeFields
        shape={{ kind: 'hub-spoke-wheel', hubTiles: 8, spokeCount: 4, spokeTiles: 4, wheelTiles: 16 }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Wheel tiles')).toBeDefined();
  });
});
