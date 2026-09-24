import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('FloorTabs', () => {
  it('selects a level, adds one, and will not delete the last level', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onDelete = vi.fn();
    render(
      <FloorTabs
        floors={[createLoopedFloor('ground', 'Level 1', 0)]}
        selectedFloorId="ground"
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
        onRename={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add level' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete Level 1' })).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Level name')).toBeDefined();
    expect(screen.queryByText('Level name')).toBeNull();
  });

  it('requests reset when enabled', () => {
    const onRequestReset = vi.fn();
    render(
      <FloorTabs
        floors={[createLoopedFloor('ground', 'Level 1', 0)]}
        selectedFloorId="ground"
        onSelect={() => {}}
        onAdd={() => {}}
        onRequestReset={onRequestReset}
        resetDisabled={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));
    expect(onRequestReset).toHaveBeenCalled();
  });

  it('commits the selected level name on blur', () => {
    const onRename = vi.fn();
    render(
      <FloorTabs
        floors={[
          createLoopedFloor('ground', 'Level 1', 0),
          createLoopedFloor('floor-1', 'Level 2', 1),
        ]}
        selectedFloorId="floor-1"
        onSelect={() => {}}
        onAdd={() => {}}
        onDelete={() => {}}
        onRename={onRename}
      />,
    );
    fireEvent.change(screen.getByLabelText('Level name'), { target: { value: 'Attic' } });
    fireEvent.blur(screen.getByLabelText('Level name'));
    expect(onRename).toHaveBeenCalledWith('Attic');
  });
});
