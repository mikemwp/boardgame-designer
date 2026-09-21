import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('LayoutGrid', () => {
  it('activates empty slots, ignores HUD, and moves with pointer down/up', () => {
    const onSlotActivate = vi.fn();
    const onMoveCell = vi.fn();
    const floor = createLoopedFloor('ground', 'Ground', 0);
    render(
      <LayoutGrid
        floor={floor}
        selectedCellId="ground-c0"
        onSlotActivate={onSlotActivate}
        onMoveCell={onMoveCell}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-0-4'));
    expect(onSlotActivate).toHaveBeenCalledWith(0, 4);
    onSlotActivate.mockClear();
    fireEvent.click(screen.getByTestId(`slot-${floor.hud!.col}-${floor.hud!.row}`));
    expect(onSlotActivate).not.toHaveBeenCalled();
    expect(screen.getAllByLabelText('HUD — drops blocked').length).toBeGreaterThan(0);
    fireEvent.pointerDown(screen.getByTestId('slot-3-5'));
    fireEvent.pointerUp(screen.getByTestId('slot-1-1'));
    expect(onMoveCell).toHaveBeenCalledWith('ground-c7', 1, 1);
  });
});
