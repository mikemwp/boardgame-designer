import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/board/PlayCanvasViewport', () => ({
  PlayCanvasViewport: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pc-app">{children}</div>
  ),
}));

vi.mock('@playcanvas/react', () => ({
  Entity: ({
    name,
    onCreate,
    position,
    rotation,
    children,
  }: {
    name?: string;
    onCreate?: unknown;
    position?: unknown;
    rotation?: unknown;
    children?: React.ReactNode;
  }) => {
    if (onCreate !== undefined) {
      throw new TypeError('onCreate is not a function');
    }
    return (
      <div
        data-testid={`entity-${name}`}
        data-position={JSON.stringify(position ?? null)}
        data-rotation={JSON.stringify(rotation ?? null)}
      >
        {children}
      </div>
    );
  },
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
  Camera: () => null,
  Light: () => null,
  Script: ({
    pitchRange,
    enableOrbit,
  }: {
    pitchRange?: { x: number; y: number };
    enableOrbit?: boolean;
  }) => (
    <div
      data-testid="orbit-script"
      data-pitch-min={pitchRange?.x}
      data-pitch-max={pitchRange?.y}
      data-orbit={enableOrbit ? 'yes' : 'no'}
    />
  ),
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
}));

import { BoardScene } from '@/components/board/BoardScene';
import { climbSample } from '@/lib/samples/climb';
import { createGame } from '@/lib/engine/game';
import { PREVIEW_ORBIT_PITCH, PREVIEW_ORBIT_PITCH_RANGE } from '@/lib/view/orbit-camera';

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

  it('fills the test canvas without a max-w-md leftover column', () => {
    const game = createGame(climbSample, { diceEnabled: false });
    render(<BoardScene game={game} />);
    const frame = screen.getByTestId('board-frame');
    expect(frame.className).toMatch(/h-full/);
    expect(frame.className).toMatch(/w-full/);
    expect(frame.className).toMatch(/min-h-0/);
    expect(frame.className).not.toMatch(/max-w-md/);
  });

  it('looks down from +Y with the Design preview pitch clamp', () => {
    const game = createGame(climbSample, { diceEnabled: false });
    render(<BoardScene game={game} />);
    const script = screen.getByTestId('orbit-script');
    expect(script.getAttribute('data-orbit')).toBe('yes');
    expect(Number(script.getAttribute('data-pitch-min'))).toBe(PREVIEW_ORBIT_PITCH_RANGE.min);
    expect(Number(script.getAttribute('data-pitch-max'))).toBe(PREVIEW_ORBIT_PITCH_RANGE.max);
    const camera = screen.getByTestId('entity-camera');
    const rotation = JSON.parse(camera.getAttribute('data-rotation') ?? '[]') as number[];
    const position = JSON.parse(camera.getAttribute('data-position') ?? '[]') as number[];
    expect(rotation[0]).toBe(PREVIEW_ORBIT_PITCH);
    expect(position[1]).toBeGreaterThan(0);
  });
});
