import { describe, it, expect } from 'vitest';
import { cardNeedsHold, formatCardTimer, isCardHoldActive } from '@/lib/view/card-hold';

describe('card hold', () => {
  it('needs hold for a timer or extra button', () => {
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1' })).toBe(false);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', timerSeconds: 5 })).toBe(true);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', extraButton: 'Done' })).toBe(true);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', extraButton: '  ' })).toBe(false);
  });

  it('is active only after the body is visible and before release', () => {
    const card = { title: 'A', pack: 'p', id: '1', timerSeconds: 5 };
    expect(isCardHoldActive({ currentCard: card, bodyVisible: false, released: false })).toBe(false);
    expect(isCardHoldActive({ currentCard: card, bodyVisible: true, released: false })).toBe(true);
    expect(isCardHoldActive({ currentCard: card, bodyVisible: true, released: true })).toBe(false);
  });

  it('formats remaining seconds as m:ss', () => {
    expect(formatCardTimer(15)).toBe('0:15');
    expect(formatCardTimer(0)).toBe('0:00');
    expect(formatCardTimer(75)).toBe('1:15');
  });
});
