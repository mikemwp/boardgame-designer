import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { PlayPublishedGame } from '@/components/library/PlayPublishedGame';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { createDocument, publishDocument, seedLibrary } from '@/lib/library/state';
import { loadLibrary, memoryStorage, writeLibrary } from '@/lib/library/storage';
import { emptyBootstrap } from '@/lib/samples/empty';
import type { LibraryState } from '@/lib/library/types';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

vi.mock('@/lib/view/playcanvas-lifecycle', () => ({
  waitUntilPlayCanvasSlotFree: vi.fn(async () => {}),
}));

const NOW = '2026-09-21T12:00:00.000Z';

async function flush() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

describe('PlayPublishedGame', () => {
  it('plays a published game from storage by slug', async () => {
    const storage = memoryStorage();
    const seeded = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const published = publishDocument(seeded.drafts[0]!, NOW, 'climb-sample');
    writeLibrary(storage, { ...seeded, drafts: [published] });

    render(<PlayPublishedGame slug="climb-sample" storage={storage} />);
    await flush();
    expect(screen.getByText('Climb (sample) (Published) v1')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect((screen.getByRole('link', { name: 'Design' }) as HTMLAnchorElement).getAttribute('href')).toBe('/');
  });

  it('shows a missing state when the slug is unknown', async () => {
    render(<PlayPublishedGame slug="missing" storage={memoryStorage()} />);
    await flush();
    expect(screen.getByText(/No published game at \/play\/missing/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Design' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
  });

  it('does not play a draft that still holds the slug', async () => {
    const draft = {
      ...publishDocument(
        createDocument({
          id: 'g1',
          name: 'Sandbox',
          source: 'empty',
          bootstrap: toStoredBootstrap(emptyBootstrap()),
          now: NOW,
        }),
        NOW,
        'sandbox',
      ),
      status: 'draft' as const,
      published: false,
    };
    const state: LibraryState = { version: 1, activeId: 'g1', drafts: [draft] };
    const storage = memoryStorage(JSON.stringify(state));
    render(<PlayPublishedGame slug="sandbox" storage={storage} />);
    await flush();
    expect(screen.getByText(/No published game at \/play\/sandbox/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
  });

  it('shows the start overlay when the published snapshot has a Play menu', async () => {
    const storage = memoryStorage();
    const seeded = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const published = publishDocument(
      {
        ...seeded.drafts[0]!,
        bootstrap: {
          ...seeded.drafts[0]!.bootstrap,
          gameStart: {
            splashes: [],
            menu: { items: [{ id: 'm1', label: 'Play', action: 'play' }] },
          },
        },
      },
      NOW,
      'climb-sample',
    );
    writeLibrary(storage, { ...seeded, drafts: [published] });
    render(<PlayPublishedGame slug="climb-sample" storage={storage} />);
    await flush();
    expect(screen.getByTestId('game-start-overlay')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toHaveProperty('disabled', true);
  });

  it('shows loading on first paint before storage is read', () => {
    const storage = memoryStorage();
    writeLibrary(storage, seedLibrary(NOW, 'seed-1'));
    const html = renderToString(<PlayPublishedGame slug="climb-sample" storage={storage} />);
    expect(html).toContain('Loading published game…');
  });
});
