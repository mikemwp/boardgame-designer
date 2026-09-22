import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { createDocument } from '@/lib/library/state';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';

const games = [
  createDocument({
    id: 'd1',
    name: 'Sandbox',
    source: 'empty',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T12:00:00.000Z',
  }),
  createDocument({
    id: 'live',
    name: 'Live climb',
    source: 'climb',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T13:00:00.000Z',
    published: true,
  }),
];

describe('NewGameDialog', () => {
  it('does not create when the name is blank', () => {
    const onCreate = vi.fn();
    render(<NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} games={games} />);
    expect((screen.getByLabelText('Game name') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('defaults to an empty board and lists saved games before Climb sample', () => {
    const onCreate = vi.fn();
    render(<NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} games={games} />);
    expect(screen.getByText('New Game')).toBeDefined();
    expect(screen.getByLabelText('Empty board')).toHaveProperty('checked', true);
    expect(screen.getByLabelText('Sandbox (draft)')).toBeDefined();
    expect(screen.getByLabelText('Live climb (Published)')).toBeDefined();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual([
      'empty',
      'copy:d1',
      'copy:live',
      'climb',
    ]);
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Night Climb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Night Climb',
      source: 'empty',
    });
  });

  it('can create from a saved game or Climb sample', () => {
    const onCreate = vi.fn();
    render(<NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} games={games} />);
    fireEvent.click(screen.getByLabelText('Sandbox (draft)'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Copy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Copy',
      source: { copyFrom: 'd1' },
    });
  });
});
