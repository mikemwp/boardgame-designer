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
    fireEvent.click(screen.getByTestId('slot-0-0'));
    expect(onSlotActivate).toHaveBeenCalledWith(0, 0);
    onSlotActivate.mockClear();
    fireEvent.click(screen.getByTestId('slot-4-4'));
    expect(onSlotActivate).not.toHaveBeenCalled();
    expect(screen.getAllByLabelText('HUD — drops blocked').length).toBeGreaterThan(0);
    fireEvent.pointerDown(screen.getByTestId('slot-1-8'));
    fireEvent.pointerUp(screen.getByTestId('slot-0-0'));
    expect(onMoveCell).toHaveBeenCalledWith('ground-c21', 0, 0);
  });

  it('renders circle wedges as slots and does not set overflow-x-auto', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 8 });
    const { container } = render(
      <LayoutGrid floor={floor} onSlotActivate={() => {}} onMoveCell={() => {}} />,
    );
    expect(screen.getByTestId('slot-ring-0')).toBeDefined();
    expect(container.querySelector('[aria-label="Layout grid"]')?.className ?? '').not.toMatch(/overflow-x-auto/);
  });

  it('fits polar boards with a bounded aspect ratio instead of stretching full height', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 12 });
    const { container } = render(
      <LayoutGrid floor={floor} onSlotActivate={() => {}} onMoveCell={() => {}} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svg?.style.aspectRatio).toBeTruthy();
    expect(String(svg?.className ?? '')).not.toMatch(/\bh-full\b/);
  });
});
