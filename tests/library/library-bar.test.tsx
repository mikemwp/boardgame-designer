import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryBar } from '@/components/library/LibraryBar';

describe('LibraryBar', () => {
  it('shows the active name and fires New / Save / Open / Design / Test', () => {
    const onNew = vi.fn();
    const onSave = vi.fn();
    const onOpen = vi.fn();
    const onDesign = vi.fn();
    const onTest = vi.fn();
    render(
      <LibraryBar
        activeName="Climb (sample)"
        savedAt="2026-09-21T12:00:00.000Z"
        canSave
        mode="design"
        onNew={onNew}
        onSave={onSave}
        onOpen={onOpen}
        onDesign={onDesign}
        onTest={onTest}
        onDelete={() => {}}
        canDelete
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDesign).toHaveBeenCalledTimes(1);
    expect(onTest).toHaveBeenCalledTimes(1);
  });

  it('disables Save when there is no active draft', () => {
    render(
      <LibraryBar
        activeName="No game"
        canSave={false}
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={() => {}}
        canDelete={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
  });

  it('fires Delete when the active game is a draft', () => {
    const onDelete = vi.fn();
    render(
      <LibraryBar
        activeName="Sandbox"
        canSave
        canDelete
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('disables Delete for a published game', () => {
    render(
      <LibraryBar
        activeName="Live climb"
        canSave
        canDelete={false}
        published
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
  });
});
