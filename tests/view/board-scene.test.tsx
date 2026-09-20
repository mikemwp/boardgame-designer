import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@playcanvas/react', () => ({
  Application: ({ children }: { children: React.ReactNode }) => <div data-testid="pc-app">{children}</div>,
  Entity: ({ name }: { name?: string }) => <div data-testid={`entity-${name}`} />,
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
  Camera: () => null,
  Light: () => null,
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
});
