import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { createDocument } from '@/lib/library/state';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';

const drafts = [
  createDocument({
    id: 'd1',
    name: 'Climb (sample)',
    source: 'climb',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T12:00:00.000Z',
  }),
  createDocument({
    id: 'd2',
    name: 'Sandbox',
    source: 'empty',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T13:00:00.000Z',
  }),
];

describe('OpenGameDialog', () => {
  it('lists drafts and opens the chosen one', () => {
    const onOpen = vi.fn();
    render(
      <OpenGameDialog
        open
        onOpenChange={() => {}}
        drafts={drafts}
        activeId="d1"
        onOpen={onOpen}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.queryByText(/live/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Sandbox' }));
    expect(onOpen).toHaveBeenCalledWith('d2');
  });

  it('shows an empty copy when there are no drafts', () => {
    render(
      <OpenGameDialog
        open
        onOpenChange={() => {}}
        drafts={[]}
        activeId={null}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No drafts on this device.')).toBeDefined();
  });
});
