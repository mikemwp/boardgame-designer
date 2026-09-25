import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/board/PlayCanvasViewport', () => ({
  PlayCanvasViewport: ({
    children,
    slotId,
    className,
  }: {
    children: React.ReactNode;
    slotId?: string;
    className?: string;
  }) => (
    <div data-testid="pc-app" data-slot-id={slotId} className={className}>{children}</div>
  ),
}));

vi.mock('@playcanvas/react', () => ({
  Entity: ({ name, onCreate }: { name?: string; onCreate?: unknown }) => {
    if (onCreate !== undefined) {
      throw new TypeError('onCreate is not a function');
    }
    return <div data-testid={`entity-${name}`} />;
  },
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
  Camera: () => null,
  Light: () => null,
  Script: () => null,
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
}));

import { FloorPreview } from '@/components/board/FloorPreview';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { climbSample } from '@/lib/samples/climb';

describe('FloorPreview', () => {
  it('keeps a stable preview mount with minimum height', () => {
    render(
      <FloorPreview
        board={climbSample.board}
        floorId="lobby"
        selectedCellId="lobby-c0"
      />,
    );
    const preview = screen.getByTestId('floor-preview');
    expect(preview.className).toMatch(/h-full/);
    expect(preview.className).toMatch(/min-h-64/);
    expect(preview.className).not.toMatch(/flex-1/);
    const viewport = screen.getByTestId('pc-app');
    expect(viewport.getAttribute('data-slot-id')).toBe('design-floor-preview');
    expect(viewport.className).toMatch(/min-h-64/);
    expect(viewport.className).toMatch(/h-full/);
  });

  it('renders only the selected floor cells and never a 3D die', () => {
    render(
      <FloorPreview
        board={climbSample.board}
        floorId="lobby"
        selectedCellId="lobby-c0"
      />,
    );
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.getByTestId('pc-app')).toBeDefined();
    expect(screen.getByTestId('entity-lobby-c0')).toBeDefined();
    expect(screen.queryByTestId('entity-f1-c0')).toBeNull();
    expect(screen.queryByTestId('entity-die')).toBeNull();
  });

  it('renders an orange landing rim on the chosen dest tile only', () => {
    const ground = createLoopedFloor('ground', 'Level 1', 0);
    const upper = createLoopedFloor('floor-1', 'Level 2', 1);
    const landing = upper.cells.find((cell) => cell.col === 0 && cell.row === 0)!;
    const other = upper.cells.find((cell) => cell.col === 1 && cell.row === 0)!;
    const board = createBoard(
      [ground, upper],
      [{ id: 's-ground-c3', fromFloorId: 'ground', toFloorId: 'floor-1', toCellId: landing.id, legal: true }],
    );
    render(
      <FloorPreview
        board={board}
        floorId="floor-1"
        landingCellIds={[landing.id]}
      />,
    );
    expect(screen.getByTestId(`entity-${landing.id}-landing`)).toBeDefined();
    expect(screen.queryByTestId(`entity-${other.id}-landing`)).toBeNull();
    expect(screen.queryByText(/landing/i)).toBeNull();
  });
});
