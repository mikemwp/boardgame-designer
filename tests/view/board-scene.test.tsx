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

import { BoardScene } from '@/components/board/BoardScene';
import { climbSample } from '@/lib/samples/climb';
import { createGame } from '@/lib/engine/game';

describe('BoardScene', () => {
  it('mounts PlayCanvas Application', () => {
    const game = createGame(climbSample, { diceEnabled: false });
    render(<BoardScene game={game} />);
    expect(screen.getByTestId('pc-app')).toBeDefined();
  });

  it('does not mount a 3D die on the play board', () => {
    const game = createGame(climbSample, { diceEnabled: true, movementViz: 'dice' });
    render(<BoardScene game={game} />);
    expect(screen.queryByTestId('entity-die')).toBeNull();
  });
});
