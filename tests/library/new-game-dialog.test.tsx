import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewGameDialog } from '@/components/library/NewGameDialog';

describe('NewGameDialog', () => {
  it('does not create when the name is blank', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('creates a named Climb draft by default', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Night Climb' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Night Climb',
      source: 'climb',
    });
  });

  it('can create from the empty board', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Sandbox',
      source: 'empty',
    });
  });
});
