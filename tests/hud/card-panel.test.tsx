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
        onDispatch={onDispatch}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pass' }));
    expect(onDispatch).toHaveBeenCalledWith({ type: 'PASS_CARD', packId: 'climb' });
  });
});
