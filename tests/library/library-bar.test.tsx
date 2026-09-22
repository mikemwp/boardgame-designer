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
        activeName="Climb (sample) (draft)"
        canSave
        canTest
        mode="design"
        onNew={onNew}
        onSave={onSave}
        onOpen={onOpen}
        onDesign={onDesign}
        onTest={onTest}
        onDelete={() => {}}
        canDelete
        canPublish
        onPublish={() => {}}
      />,
    );
    expect(screen.getByText('Climb (sample) (draft)')).toBeDefined();
    expect(screen.queryByTestId('library-saved-at')).toBeNull();
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

  it('disables Save, Test, and Delete when there is no active game', () => {
    render(
      <LibraryBar
        activeName=""
        canSave={false}
        canTest={false}
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
    expect(screen.getByRole('button', { name: 'Test' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveProperty('disabled', true);
    expect(screen.queryByText('No game')).toBeNull();
  });

  it('uses the same outline style for Save as the other library buttons', () => {
    render(
      <LibraryBar
        activeName="Sandbox (draft)"
        canSave
        canTest
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={() => {}}
        canDelete
      />,
    );
    const save = screen.getByRole('button', { name: 'Save' });
    const open = screen.getByRole('button', { name: 'Open' });
    expect(save.className).toContain('hover:bg-slate-600');
    expect(open.className).toContain('hover:bg-slate-600');
  });

  it('fires Delete when the active game is a draft', () => {
    const onDelete = vi.fn();
    render(
      <LibraryBar
        activeName="Sandbox (draft)"
        canSave
        canTest
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

  it('fires Publish when enabled', () => {
    const onPublish = vi.fn();
    render(
      <LibraryBar
        activeName="Climb (sample) (draft)"
        canSave
        canTest
        canDelete
        canPublish
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={() => {}}
        onPublish={onPublish}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('disables Publish when canPublish is false', () => {
    render(
      <LibraryBar
        activeName="Sandbox (draft)"
        canSave
        canTest
        canDelete
        canPublish={false}
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveProperty('disabled', true);
  });

  it('disables Delete for a published game', () => {
    render(
      <LibraryBar
        activeName="Live climb (Published) v1"
        canSave
        canTest
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
