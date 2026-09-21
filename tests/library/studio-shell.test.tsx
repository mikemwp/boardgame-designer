import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudioShell } from '@/components/library/StudioShell';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

const NOW = '2026-09-21T12:00:00.000Z';

describe('StudioShell', () => {
  it('seeds Climb and keeps Roll dice plus the HUD card empty state', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => NOW}
        createId={() => 'n1'}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
    expect(screen.getByText('No roll yet')).toBeDefined();
  });

  it('New empty remounts play onto a board with no climb passes', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T13:00:00.000Z'}
        createId={() => 'empty-1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByText('Passes left: climb 1')).toBeNull();
    expect(screen.getByText('No card drawn')).toBeDefined();
  });

  it('Open switches back to the Climb draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T13:00:00.000Z'}
        createId={() => 'empty-1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Climb (sample)' }));
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });

  it('Save persists imported-card capture across a remount from storage', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const view = render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T14:00:00.000Z'}
        createId={() => 'n1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Import cards' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('library-saved-at').textContent).toContain(
      '2026-09-21T14:00:00.000Z',
    );
    view.unmount();
    const reloaded = loadLibrary(memoryStorage(storage.read()), {
      now: NOW,
      id: 'other',
    });
    expect(reloaded.drafts[0]?.updatedAt).toBe('2026-09-21T14:00:00.000Z');
  });
});
