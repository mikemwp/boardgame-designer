import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { FloorStack } from '@/components/board/FloorStack';

vi.mock('@playcanvas/react', () => ({
  Entity: ({ name, children, ...rest }: { name: string; children?: React.ReactNode }) => (
    <div data-testid={`entity-${name}`} {...rest}>{children}</div>
  ),
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
  useApp: () => null,
}));

describe('FloorStack', () => {
  it('names a circle wedge entity with the cell id', () => {
    const board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 6 })],
      [],
    );
    render(<FloorStack board={board} selectedCellId="ground-c0" />);
    expect(screen.getByTestId('polygon-tile-ground-c0')).toBeDefined();
  });

  it('requests polygon tiles for circle cells', () => {
    const board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 6 })],
      [],
    );
    render(<FloorStack board={board} selectedCellId="ground-c0" />);
    expect(screen.getByTestId('polygon-tile-ground-c0')).toBeDefined();
  });
});
