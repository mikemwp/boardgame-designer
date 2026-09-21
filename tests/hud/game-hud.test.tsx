import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

import { GameHud } from '@/components/hud/GameHud';
import { climbSample } from '@/lib/samples/climb';

describe('GameHud', () => {
  it('has Roll dice and no Climb stair debug control', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Climb stair' })).toBeNull();
    expect(screen.getByText('No roll yet')).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
  });

  it('shows remaining passes for the active player', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });

  it('locks Roll until Play or Pass, then unlocks after Play', () => {
    render(<GameHud bootstrap={{ ...climbSample, rng: () => 0 }} />);
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    fireEvent.click(roll);
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(roll).toHaveProperty('disabled', false);
  });
});
