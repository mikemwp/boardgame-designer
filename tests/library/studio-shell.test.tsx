import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StudioShell } from '@/components/library/StudioShell';
import { getActive } from '@/lib/library/state';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

vi.mock('@/components/board/FloorPreview', () => ({
  FloorPreview: () => <div data-testid="floor-preview" />,
}));

vi.mock('@/lib/view/playcanvas-lifecycle', () => ({
  waitUntilPlayCanvasSlotFree: vi.fn(async () => {}),
}));

const NOW = '2026-09-21T12:00:00.000Z';

async function flushTestViewport() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

function renderStudio(storage = memoryStorage(), id = 'seed-1', now = NOW, createId = () => 'n1') {
  const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
  return render(
    <StudioShell
      storage={storage}
      initialState={initialState}
      now={() => now}
      createId={createId}
    />,
  );
}

describe('StudioShell', () => {
  it('opens in Design on Climb and Test reveals Roll dice', async () => {
    renderStudio();
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    await flushTestViewport();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
    expect(screen.queryByTestId('floor-preview')).toBeNull();
  });

  it('blocks Test on a dangling stair and still allows Save', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T13:00:00.000Z');
    fireEvent.click(screen.getByRole('button', { name: 'Tile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stair' }));
    fireEvent.click(screen.getByTestId('slot-2-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByTestId('layout-issues').textContent).toContain('stair has no destination');
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('library-saved-at').textContent).toContain('2026-09-21T13:00:00.000Z');
  });

  it('New empty stays in Design and blocks Test until a start tile is marked', async () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByTestId('layout-issues').textContent).toContain('Mark a start tile');
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    await flushTestViewport();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByText('Passes left: climb 1')).toBeNull();
  });

  it('Open switches back to Climb and Design can return to the grid', async () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Climb (sample)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    await flushTestViewport();
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Lobby' })).toBeDefined();
  });

  it('uses a viewport shell without overflow-x-auto', () => {
    renderStudio();
    const shell = screen.getByTestId('studio-shell');
    expect(shell.className).toMatch(/overflow-hidden/);
    expect(shell.className).not.toMatch(/overflow-x-auto/);
  });

  it('Save persists board shape on the library draft', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T15:00:00.000Z');
    fireEvent.change(screen.getByLabelText('Board shape'), { target: { value: 'rectangle' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(reloaded.drafts[0]?.bootstrap.board.floors[0]?.shape?.kind).toBe('rectangle');
  });

  it('reloads the last active game from storage instead of the Climb sample', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox')).toBeDefined();
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(reloaded.activeId).toBe('empty-1');
    expect(getActive(reloaded)?.name).toBe('Sandbox');
  });

  it('Save persists a pack attached in Design into storage', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T14:00:00.000Z');
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const lobby = reloaded.drafts[0]?.bootstrap.board.floors.find((f) => f.id === 'lobby');
    expect(lobby?.cells.find((c) => c.id === 'lobby-c0')?.packId).toBe('climb');
  });
});
