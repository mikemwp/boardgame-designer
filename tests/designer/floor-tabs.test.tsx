import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('FloorTabs', () => {
  it('selects a floor, adds one, and will not delete the last floor', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onDelete = vi.fn();
    render(
      <FloorTabs
        floors={[createLoopedFloor('ground', 'Ground', 0)]}
        selectedFloorId="ground"
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add floor' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete Ground' })).toHaveProperty('disabled', true);
  });
});
