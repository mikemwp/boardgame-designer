import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardPanel } from '@/components/hud/CardPanel';

describe('CardPanel', () => {
  it('shows Pass button when actionMode is both', () => {
    const onDispatch = vi.fn();
    render(
      <CardPanel
        actionMode="both"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung' }}
        awaitingAction
        onDispatch={onDispatch}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pass' }));
    expect(onDispatch).toHaveBeenCalledWith({ type: 'PASS_CARD', packId: 'climb' });
  });

  it('hides Play and Pass after the card is accepted', () => {
    render(
      <CardPanel
        actionMode="both"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung', body: 'Clue' }}
        bodyVisible
        awaitingAction={false}
        onDispatch={() => {}}
      />,
    );
    expect(screen.getByText('Clue')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pass' })).toBeNull();
  });

  it('hides body until visible', () => {
    render(
      <CardPanel
        actionMode="both"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung', body: 'Secret clue' }}
        bodyVisible={false}
        onDispatch={() => {}}
      />,
    );
    expect(screen.queryByText('Secret clue')).toBeNull();
  });

  it('shows body when visible', () => {
    render(
      <CardPanel
        actionMode="neither"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung', body: 'Secret clue' }}
        bodyVisible
        onDispatch={() => {}}
      />,
    );
    expect(screen.getByText('Secret clue')).toBeDefined();
  });
});
