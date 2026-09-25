import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PackEditor } from '@/components/designer/PackEditor';

const noop = {
  onSelectPack: vi.fn(),
  onSelectCard: vi.fn(),
  onCreatePack: vi.fn(),
  onCopyPack: vi.fn(),
  onRenamePack: vi.fn(),
  onRemovePack: vi.fn(),
  onDeletePack: vi.fn(),
  onCreateCard: vi.fn(),
  onCopyCard: vi.fn(),
  onUpdateCard: vi.fn(),
  onRemoveCard: vi.fn(),
  onDeleteCard: vi.fn(),
  onSetPackBack: vi.fn(),
};

describe('PackEditor', () => {
  it('shows New/Copy pack and per-row Remove/Delete without a Pack id label', () => {
    const onCreatePack = vi.fn();
    const onRemovePack = vi.fn();
    const onDeletePack = vi.fn();
    const onRenamePack = vi.fn();
    const onSelectPack = vi.fn();

    const { rerender } = render(
      <PackEditor
        {...noop}
        packs={[]}
        cards={[]}
        selectedPackId={null}
        selectedCardId={null}
        onCreatePack={onCreatePack}
        onRemovePack={onRemovePack}
        onDeletePack={onDeletePack}
        onRenamePack={onRenamePack}
        onSelectPack={onSelectPack}
      />,
    );
    expect(screen.getByText(/No packs yet/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    expect(onCreatePack).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copy pack' })).toBeDefined();
    expect(screen.queryByLabelText('Pack id')).toBeNull();

    rerender(
      <PackEditor
        {...noop}
        packs={['notes']}
        cards={[]}
        selectedPackId="notes"
        selectedCardId={null}
        onCreatePack={onCreatePack}
        onRemovePack={onRemovePack}
        onDeletePack={onDeletePack}
        onRenamePack={onRenamePack}
        onSelectPack={onSelectPack}
      />,
    );
    expect(screen.getByText('This pack has no cards yet.')).toBeDefined();
    expect(screen.getByLabelText('Pack name')).toBeDefined();
    expect(screen.getByText('Back of pack')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Pack name'), { target: { value: 'clues' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename pack' }));
    expect(onRenamePack).toHaveBeenCalledWith('clues');
    fireEvent.click(screen.getByRole('button', { name: 'Remove pack notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove pack' }));
    expect(onRemovePack).toHaveBeenCalledWith('notes');
    fireEvent.click(screen.getByRole('button', { name: 'Delete pack notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete pack' }));
    expect(onDeletePack).toHaveBeenCalledWith('notes');
    expect(screen.queryByLabelText('Pack id')).toBeNull();
  });

  it('keeps cards on the pack and uses row Remove/Delete instead of detail Delete', () => {
    const onCreateCard = vi.fn();
    const onRemoveCard = vi.fn();
    const onDeleteCard = vi.fn();
    const onUpdateCard = vi.fn();
    const onSelectCard = vi.fn();

    const { rerender } = render(
      <PackEditor
        {...noop}
        packs={['notes']}
        cards={[{ id: 'notes-1', pack: 'notes', title: 'Card 1', body: '' }]}
        selectedPackId="notes"
        selectedCardId="notes-1"
        onCreateCard={onCreateCard}
        onRemoveCard={onRemoveCard}
        onDeleteCard={onDeleteCard}
        onUpdateCard={onUpdateCard}
        onSelectCard={onSelectCard}
        gameId="g1"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    expect(onCreateCard).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copy card' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Door' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ title: 'Door' });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Knock' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ body: 'Knock' });
    fireEvent.change(screen.getByLabelText('Card type'), { target: { value: 'timer' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ cardType: 'timer' });
    rerender(
      <PackEditor
        {...noop}
        packs={['notes']}
        cards={[{ id: 'notes-1', pack: 'notes', title: 'Card 1', body: '', cardType: 'timer' }]}
        selectedPackId="notes"
        selectedCardId="notes-1"
        onCreateCard={onCreateCard}
        onRemoveCard={onRemoveCard}
        onDeleteCard={onDeleteCard}
        onUpdateCard={onUpdateCard}
        onSelectCard={onSelectCard}
        gameId="g1"
      />,
    );
    fireEvent.change(screen.getByLabelText('Timer seconds'), { target: { value: '15' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ timerSeconds: 15 });
    expect(screen.queryByLabelText('Extra button')).toBeNull();
    expect(screen.getByText('Card image')).toBeDefined();
    expect(screen.getByText('Audio')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Delete card' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove card Card 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove card' }));
    expect(onRemoveCard).toHaveBeenCalledWith('notes-1');
    fireEvent.click(screen.getByRole('button', { name: 'Delete card Card 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(onDeleteCard).toHaveBeenCalledWith('notes-1');
  });

  it('disables New/Copy card until a pack is selected and copies from picker sources', () => {
    const onCopyPack = vi.fn();
    const onCopyCard = vi.fn();
    const { rerender } = render(
      <PackEditor
        {...noop}
        packs={[]}
        cards={[]}
        selectedPackId={null}
        selectedCardId={null}
        onCopyPack={onCopyPack}
        onCopyCard={onCopyCard}
        copyPackSources={[{ kind: 'floating', floatingId: 'float-pack-1', packName: 'odds' }]}
        copyCardSources={[{ kind: 'floating', cardId: 'float-card-1', cardTitle: 'Loose' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'New card' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Copy card' })).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Copy pack' }));
    fireEvent.click(screen.getByLabelText('odds'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy into game' }));
    expect(onCopyPack).toHaveBeenCalledWith({
      kind: 'floating',
      floatingId: 'float-pack-1',
      packName: 'odds',
    });

    rerender(
      <PackEditor
        {...noop}
        packs={['notes']}
        cards={[]}
        selectedPackId="notes"
        selectedCardId={null}
        onCopyPack={onCopyPack}
        onCopyCard={onCopyCard}
        copyPackSources={[{ kind: 'floating', floatingId: 'float-pack-1', packName: 'odds' }]}
        copyCardSources={[{ kind: 'floating', cardId: 'float-card-1', cardTitle: 'Loose' }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy card' }));
    fireEvent.click(screen.getByLabelText('Loose'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy into pack' }));
    expect(onCopyCard).toHaveBeenCalledWith({ kind: 'floating', cardId: 'float-card-1', cardTitle: 'Loose' });
  });

  it('shows game name plus pack name for game-owned copy sources', () => {
    render(
      <PackEditor
        {...noop}
        packs={[]}
        cards={[]}
        selectedPackId={null}
        selectedCardId={null}
        copyPackSources={[
          { kind: 'game', gameId: 'g1', gameName: 'Climb (sample)', packName: 'climb' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy pack' }));
    expect(screen.getByLabelText('Climb (sample) climb')).toBeDefined();
  });
});
