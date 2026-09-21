import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
});
