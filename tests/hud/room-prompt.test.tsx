import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RoomPrompt } from '@/components/hud/RoomPrompt';

describe('RoomPrompt', () => {
  it('shows Leave and Stay when awaiting a door exit', () => {
    const onLeave = vi.fn();
    const onStay = vi.fn();
    render(
      <RoomPrompt
        awaitingRoom={false}
        awaitingDoorExit
        canLeave={false}
        onEnter={() => {}}
        onPass={() => {}}
        onLeave={onLeave}
        onStay={onStay}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    expect(onStay).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onLeave).toHaveBeenCalled();
  });
});
