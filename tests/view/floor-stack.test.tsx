import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { FloorStack } from '@/components/board/FloorStack';

vi.mock('@playcanvas/react', () => ({
  Entity: ({
    name,
    children,
    onCreate,
    ...rest
  }: {
    name: string;
    children?: React.ReactNode;
    onCreate?: unknown;
  }) => {
    if ('onCreate' in (rest as object) || onCreate !== undefined) {
      if (typeof onCreate !== 'function') {
        throw new TypeError('onCreate is not a function');
      }
      throw new TypeError('onCreate is not a function');
    }
    return (
      <div data-testid={`entity-${name}`} {...rest}>
        {children}
      </div>
    );
  },
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: (props: Record<string, unknown>) => {
    if ('onCreate' in props) {
      throw new TypeError('onCreate is not a function');
    }
    return null;
  },
  Collision: () => null,
  RigidBody: () => null,
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
  useApp: () => null,
}));

describe('FloorStack', () => {
  it('names a circle wedge entity with the cell id without React DOM props on Entity', () => {
    const board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 6 })],
      [],
    );
    render(<FloorStack board={board} selectedCellId="ground-c0" />);
    expect(screen.getByTestId('entity-ground-c0')).toBeDefined();
    expect(screen.queryByTestId('polygon-tile-ground-c0')).toBeNull();
  });

  it('requests polygon tiles for circle cells', () => {
    const board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 6 })],
      [],
    );
    render(<FloorStack board={board} selectedCellId="ground-c0" />);
    expect(screen.getByTestId('entity-ground-c0')).toBeDefined();
  });

  it('names start and HUD cells without painting text labels', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const start = floor.cells.find((c) => c.kind !== 'hud')!;
    const hud = floor.cells.find((c) => c.kind === 'hud')!;
    const board = createBoard(
      [{ ...floor, cells: floor.cells.map((c) => (c.id === start.id ? { ...c, start: true } : c)) }],
      [],
    );
    render(<FloorStack board={board} selectedCellId={start.id} />);
    expect(screen.getByTestId(`entity-${start.id}`)).toBeDefined();
    expect(screen.getByTestId(`entity-${hud.id}`)).toBeDefined();
    expect(screen.queryByText('Start')).toBeNull();
    expect(screen.queryByText('HUD')).toBeNull();
  });

  it('renders an empty board without crashing', () => {
    expect(() => render(<FloorStack board={createBoard([], [])} />)).not.toThrow();
    expect(screen.queryByTestId(/entity-/)).toBeNull();
  });

  it('does not forward a React onCreate onto PlayCanvas Entity or mesh', () => {
    const board = createBoard(
      [createLoopedFloor('ground', 'Ground', 0)],
      [],
    );
    expect(() =>
      render(
        <FloorStack
          board={board}
          // @ts-expect-error — React create handlers must not reach PlayCanvas
          onCreate={'not-a-function'}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId('entity-ground-c0')).toBeDefined();
  });
});
