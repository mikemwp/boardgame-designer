import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { createLoopedFloor } from '@/lib/engine/layout';
import { DESIGNER_POLAR_PAD, shapeSlotBounds } from '@/lib/engine/shape-layout';

describe('LayoutGrid', () => {
  it('renders cartesian slots with computed tile size', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    render(
      <LayoutGrid floor={floor} onSlotActivate={() => {}} onMoveCell={() => {}} />,
    );
    const slot = screen.getByTestId('slot-0-0');
    expect(slot.style.width).toBeTruthy();
    expect(slot.style.height).toBeTruthy();
  });

  it('activates empty slots, ignores HUD zones for corridor moves, and moves with pointer down/up', () => {
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
    fireEvent.click(screen.getByTestId('slot-1-1'));
    expect(onSlotActivate).toHaveBeenCalledWith(1, 1);
    onSlotActivate.mockClear();
    fireEvent.click(screen.getByTestId('slot-2-2'));
    expect(onSlotActivate).toHaveBeenCalledWith(2, 2);
    expect(screen.getAllByText('HUD').length).toBeGreaterThan(0);
    fireEvent.pointerDown(screen.getByTestId('slot-0-7'));
    fireEvent.pointerUp(screen.getByTestId('slot-1-1'));
    expect(onMoveCell).toHaveBeenCalledWith('ground-c7', 1, 1);
  });

  it('labels room and door tiles on the cartesian grid', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const neighbor = floor.cells.find((c) => c.col === 1 && c.row === 0)!;
    const withRooms = {
      ...floor,
      cells: [
        ...floor.cells.map((c) => (c.id === neighbor.id ? { ...c, kind: 'door' as const } : c)),
        { id: 'ground-room', index: 99, kind: 'room' as const, col: 1, row: 1 },
      ],
    };
    render(<LayoutGrid floor={withRooms} onSlotActivate={() => {}} onMoveCell={() => {}} />);
    expect(screen.getByText('Room')).toBeDefined();
    expect(screen.getByText('Door')).toBeDefined();
  });

  it('renders an erased HUD square as empty, not as the word HUD', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const hud = floor.cells.find((c) => c.kind === 'hud')!;
    const erased = { ...floor, cells: floor.cells.filter((c) => c.id !== hud.id) };
    render(
      <LayoutGrid floor={erased} onSlotActivate={() => {}} onMoveCell={() => {}} />,
    );
    const slot = screen.getByTestId(`slot-${hud.col}-${hud.row}`);
    expect(slot.textContent).toBe('');
    expect(slot.getAttribute('aria-label')).toBe(`Empty ${hud.col},${hud.row}`);
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

  it('uses designer polar padding so the full circle fits in the view box', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 12 });
    const { container } = render(
      <LayoutGrid floor={floor} onSlotActivate={() => {}} onMoveCell={() => {}} />,
    );
    const svg = container.querySelector('svg');
    const bounds = shapeSlotBounds({ kind: 'circle', tiles: 12 }, DESIGNER_POLAR_PAD);
    const expected = `${bounds.minX} ${bounds.minZ} ${bounds.maxX - bounds.minX} ${bounds.maxZ - bounds.minZ}`;
    expect(svg?.getAttribute('viewBox')).toBe(expected);
    expect(bounds.maxX - bounds.minX).toBeGreaterThan(6);
  });

  it('labels a dice HUD widget Dice', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const hud = floor.cells.find((c) => c.kind === 'hud')!;
    const withDice = {
      ...floor,
      cells: floor.cells.map((c) => (c.id === hud.id ? { ...c, hudWidget: 'dice' as const } : c)),
    };
    render(<LayoutGrid floor={withDice} onSlotActivate={() => {}} onMoveCell={() => {}} />);
    expect(screen.getByText('Dice')).toBeDefined();
  });
});
