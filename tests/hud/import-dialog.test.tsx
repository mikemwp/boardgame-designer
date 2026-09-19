import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';

describe('ImportCardsDialog', () => {
  it('parses uploaded csv and calls onImport', async () => {
    const onImport = vi.fn();
    render(<ImportCardsDialog open onOpenChange={() => {}} onImport={onImport} />);
    const file = new File(['pack,title\nclimb,Step\n'], 'cards.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() => expect(onImport).toHaveBeenCalled());
  });
});
