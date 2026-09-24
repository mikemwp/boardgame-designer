import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PackEditor } from '@/components/designer/PackEditor';

describe('PackEditor', () => {
  it('shows empty copy then creates, edits, and deletes through callbacks', () => {
    const onCreatePack = vi.fn();
    const onRenamePack = vi.fn();
    const onDeletePack = vi.fn();
    const onCreateCard = vi.fn();
    const onUpdateCard = vi.fn();
    const onDeleteCard = vi.fn();
    const onSelectPack = vi.fn();
    const onSelectCard = vi.fn();

    const { rerender } = render(
      <PackEditor
        packs={[]}
        cards={[]}
        selectedPackId={null}
        selectedCardId={null}
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    expect(screen.getByText(/Create a pack to attach to tiles/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    expect(onCreatePack).toHaveBeenCalled();

    rerender(
      <PackEditor
        packs={['notes']}
        cards={[]}
        selectedPackId="notes"
        selectedCardId={null}
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    expect(screen.getByText('This pack has no cards yet.')).toBeDefined();
    expect(screen.getByText('0 cards')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Pack id'), { target: { value: 'clues' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename pack' }));
    expect(onRenamePack).toHaveBeenCalledWith('clues');
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    expect(onCreateCard).toHaveBeenCalled();

    rerender(
      <PackEditor
        packs={['notes']}
        cards={[{ id: 'notes-1', pack: 'notes', title: 'Card 1', body: '' }]}
        selectedPackId="notes"
        selectedCardId="notes-1"
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Door' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ title: 'Door' });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Knock' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ body: 'Knock' });
    fireEvent.change(screen.getByLabelText('Timer seconds'), { target: { value: '15' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ timerSeconds: 15 });
    fireEvent.change(screen.getByLabelText('Extra button'), { target: { value: 'Done' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ extraButton: 'Done' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(onDeleteCard).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete pack' }));
    expect(onDeletePack).toHaveBeenCalled();
  });

  it('shows Audio on the selected card', () => {
    const onUpdateCard = vi.fn();
    render(
      <PackEditor
        packs={['notes']}
        cards={[{ id: 'notes-1', pack: 'notes', title: 'Card 1' }]}
        selectedPackId="notes"
        selectedCardId="notes-1"
        onSelectPack={() => {}}
        onSelectCard={() => {}}
        onCreatePack={() => {}}
        onRenamePack={() => {}}
        onDeletePack={() => {}}
        onCreateCard={() => {}}
        onUpdateCard={onUpdateCard}
        onDeleteCard={() => {}}
        gameId="g1"
      />,
    );
    expect(screen.getByText('Audio')).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('https://…'), {
      target: { value: 'https://example.com/deal.mp3' },
    });
    fireEvent.blur(screen.getByPlaceholderText('https://…'));
    expect(onUpdateCard).toHaveBeenCalledWith(
      expect.objectContaining({ audio: expect.objectContaining({ source: 'url' }) }),
    );
  });
});
