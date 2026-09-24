import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RoomTabs } from '@/components/designer/RoomTabs';

describe('RoomTabs', () => {
  it('lists multi-tile rooms and a Room name field without a visible label', () => {
    const onSelect = vi.fn();
    const onRename = vi.fn();
    render(
      <RoomTabs
        rooms={[
          { id: 'room-1', name: 'Room 1', mode: 'multi', shape: { kind: 'square', tilesPerSide: 3 }, cells: [] },
          { id: 'room-2', name: 'Den', mode: 'multi', shape: { kind: 'square', tilesPerSide: 3 }, cells: [] },
        ]}
        selectedRoomId="room-1"
        onSelect={onSelect}
        onRename={onRename}
        onRequestReset={() => {}}
        onRequestDelete={() => {}}
        resetDisabled={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'Room 1' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Den' }));
    expect(onSelect).toHaveBeenCalledWith('room-2');
    const name = screen.getByLabelText('Room name');
    expect(name).toBeDefined();
    expect(screen.queryByText('Room name')).toBeNull();
    fireEvent.blur(name, { target: { value: 'Parlor' } });
    expect(onRename).toHaveBeenCalledWith('Parlor');
    expect(screen.getByRole('button', { name: 'Delete room' })).toHaveProperty('disabled', false);
    expect(screen.getByRole('button', { name: 'Reset room' })).toHaveProperty('disabled', false);
  });
});
