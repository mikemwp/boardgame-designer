import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlayerEditor } from '@/components/designer/PlayerEditor';

describe('PlayerEditor', () => {
  it('does not create items and points at the Items tab', () => {
    const onStarting = vi.fn();
    render(
      <PlayerEditor
        items={[]}
        itemAssign="random"
        selectedId={null}
        onSelect={() => {}}
        onStarting={onStarting}
        onAssign={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'New item' })).toBeNull();
    expect(screen.getByText('Create items on the Items tab.')).toBeDefined();
  });

  it('marks a catalog item as starting', () => {
    const onStarting = vi.fn();
    render(
      <PlayerEditor
        items={[{ id: 'item-1', name: 'Lock pick', starting: false }]}
        itemAssign="random"
        selectedId="item-1"
        onSelect={() => {}}
        onStarting={onStarting}
        onAssign={() => {}}
      />,
    );
    fireEvent.click(screen.getByLabelText('Starting item'));
    expect(onStarting).toHaveBeenCalledWith(true);
  });
});
