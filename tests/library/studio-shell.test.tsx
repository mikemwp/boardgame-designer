import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
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
  it('shows loading on first render without initialState then hydrates the shell', async () => {
    const storage = memoryStorage();
    loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const props = { storage, now: () => NOW, createId: () => 'x' };

    const ssrHtml = renderToString(<StudioShell {...props} />);
    expect(ssrHtml).toContain('Loading library…');
    expect(ssrHtml).not.toContain('data-testid="studio-shell"');

    let markupDuringRender: string | undefined;
    function CaptureFirstPaint() {
      if (markupDuringRender === undefined) {
        markupDuringRender = renderToString(<StudioShell {...props} />);
      }
      return <StudioShell {...props} />;
    }

    render(<CaptureFirstPaint />);
    expect(markupDuringRender).toContain('Loading library…');
    expect(markupDuringRender).not.toContain('data-testid="studio-shell"');

    expect(screen.getByTestId('studio-shell')).toBeDefined();
    expect(screen.getByText('Climb (sample) (draft)')).toBeDefined();
    expect(screen.getByText('Building Board Template')).toBeDefined();
    expect(screen.queryByText('Studio — drafts stay on this device')).toBeNull();
  });

  it('opens in Design on Climb and Test reveals Roll dice', async () => {
    renderStudio();
    expect(screen.getByText('Climb (sample) (draft)')).toBeDefined();
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
    fireEvent.click(screen.getByTestId('slot-1-0'));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByTestId('layout-issues').textContent).toContain('stair has no destination');
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const afterSave = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(afterSave.drafts[0]?.updatedAt).toBe('2026-09-21T13:00:00.000Z');
    expect(afterSave.drafts[0]?.lastSaved).toBe('2026-09-21T13:00:00.000Z');
  });

  it('New empty stays in Design and blocks Test until a start tile is marked', async () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox (draft)')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByTestId('layout-issues').textContent).toContain('Mark a start tile');
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByTestId('slot-0-0'));
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
    expect(screen.getByText('Sandbox (draft)')).toBeDefined();
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(reloaded.activeId).toBe('empty-1');
    expect(getActive(reloaded)?.name).toBe('Sandbox');
  });

  it('Save persists a pack attached in Design into storage', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T14:00:00.000Z');
    fireEvent.click(screen.getByTestId('slot-0-0'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const lobby = reloaded.drafts[0]?.bootstrap.board.floors.find((f) => f.id === 'lobby');
    expect(lobby?.cells.find((c) => c.id === 'lobby-c0')?.packId).toBe('climb');
  });

  it('Delete asks for confirm then removes the active draft', () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox (draft)')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/Delete Sandbox/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
    expect(screen.getByText('Climb (sample) (draft)')).toBeDefined();
    expect(screen.queryByText('Sandbox (draft)')).toBeNull();
  });

  it('deleting the last draft shows the empty create state', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
    expect(screen.queryByText('No game')).toBeNull();
    expect(screen.queryByText('Create a game to start playing.')).toBeNull();
    expect(screen.getByTestId('library-game-title').textContent).toBe('');
    expect(screen.queryByTestId('floor-preview')).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Test' })).toHaveProperty('disabled', true);
  });

  it('creates an empty board after the last draft is deleted without restoring Climb', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
    expect(screen.queryByText('Create a game to start playing.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Sandbox (draft)')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.queryByText('Climb (sample) (draft)')).toBeNull();

    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(reloaded.drafts.map((d) => d.id)).toEqual(['empty-1']);
    expect(reloaded.activeId).toBe('empty-1');
    expect(reloaded.drafts.some((d) => d.name === 'Climb (sample)')).toBe(false);
  });

  it('Save persists a Design-created pack with no CSV on an empty board', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T18:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
    fireEvent.click(screen.getByTestId('slot-0-0'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'pack-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const draft = getActive(reloaded);
    expect(draft?.name).toBe('Sandbox');
    expect(draft?.bootstrap.packs).toEqual(['pack-1']);
    expect(draft?.bootstrap.cards).toEqual([
      { id: 'pack-1-1', pack: 'pack-1', title: 'Card 1' },
    ]);
    const floor = draft?.bootstrap.board.floors[0];
    expect(floor?.cells.find((c) => c.col === 0 && c.row === 0)?.packId).toBe('pack-1');
  });

  it('Save persists a room, door, pack, and end-room on an empty board', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T19:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Room' }));
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Door' }));
    fireEvent.click(screen.getByTestId('slot-1-0'));
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'pack-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'End room' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const floor = getActive(reloaded)?.bootstrap.board.floors[0];
    expect(floor?.cells.find((c) => c.col === 1 && c.row === 1)).toMatchObject({
      kind: 'room',
      packId: 'pack-1',
      end: true,
    });
    expect(floor?.cells.find((c) => c.col === 1 && c.row === 0)?.kind).toBe('door');
  });

  it('Save persists an empty pack with no cards', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T18:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    expect(getActive(reloaded)?.bootstrap.packs).toEqual(['pack-1']);
    expect(getActive(reloaded)?.bootstrap.cards).toEqual([]);
  });

  it('prompts to save before New when the board is dirty', () => {
    renderStudio();
    fireEvent.click(screen.getByTestId('slot-0-0'));
    fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    expect(screen.getByText('Save changes first?')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: "Don't save" }));
    expect(screen.getByText('New Game')).toBeDefined();
  });

  it('Save persists HUD widget, level hold quotas, and card timer fields', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T20:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'HUD' }));
    fireEvent.click(screen.getByTestId('slot-2-2'));
    fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    fireEvent.change(screen.getByLabelText('Timer seconds'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Extra button'), { target: { value: 'Done' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
    fireEvent.click(screen.getByLabelText('Level hold'));
    fireEvent.change(screen.getByLabelText('Quota for pack-1'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const draft = getActive(loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' }));
    const floor = draft?.bootstrap.board.floors[0];
    expect(floor?.cells.find((c) => c.col === 2 && c.row === 2)).toMatchObject({
      kind: 'hud',
      hudWidget: 'spinner',
    });
    expect(floor?.holdEnabled).toBe(true);
    expect(floor?.holdQuotas).toEqual({ 'pack-1': 2 });
    expect(draft?.bootstrap.cards[0]).toMatchObject({
      timerSeconds: 9,
      extraButton: 'Done',
    });
  });

  it('Test uses spinner when a spinner HUD widget is designed', async () => {
    renderStudio();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    await flushTestViewport();
    expect(screen.getByRole('button', { name: 'Spin' })).toBeDefined();
  });
});
