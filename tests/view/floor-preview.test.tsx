import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/board/PlayCanvasViewport', () => ({
  PlayCanvasViewport: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pc-app">{children}</div>
  ),
}));

vi.mock('@playcanvas/react', () => ({
  Entity: ({ name }: { name?: string }) => <div data-testid={`entity-${name}`} />,
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
  Camera: () => null,
  Light: () => null,
}));

vi.mock('@playcanvas/react/scripts', () => ({
  OrbitControls: () => null,
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
}));

import { FloorPreview } from '@/components/board/FloorPreview';
import { climbSample } from '@/lib/samples/climb';

describe('FloorPreview', () => {
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
});
