import { describe, it, expect } from 'vitest';
import {
  hasResolvableCard,
  isRollLocked,
  shouldShowDealtCard,
} from '@/lib/view/turn-loop';

const card = { id: '1', pack: 'climb', title: 'Rung', body: 'Clue' };

describe('hasResolvableCard', () => {
  it('is false with no card', () => {
    expect(hasResolvableCard(null, 'both')).toBe(false);
  });

  it('is true when both Play and Pass are allowed', () => {
    expect(hasResolvableCard(card, 'both')).toBe(true);
  });

  it('is false when action mode is neither', () => {
    expect(hasResolvableCard(card, 'neither')).toBe(false);
  });
});

describe('isRollLocked', () => {
  it('locks while the token is sliding', () => {
    expect(isRollLocked({ tokenSliding: true, currentCard: null, actionMode: 'both' })).toBe(true);
  });

  it('locks while a resolvable card is showing', () => {
    expect(isRollLocked({ tokenSliding: false, currentCard: card, actionMode: 'both' })).toBe(true);
  });

  it('unlocks after slide when no card needs resolution', () => {
    expect(isRollLocked({ tokenSliding: false, currentCard: null, actionMode: 'both' })).toBe(false);
  });

  it('unlocks for neither-mode deals after slide', () => {
    expect(isRollLocked({ tokenSliding: false, currentCard: card, actionMode: 'neither' })).toBe(false);
  });
});

describe('shouldShowDealtCard', () => {
  it('hides the card while sliding', () => {
    expect(shouldShowDealtCard({ tokenSliding: true, currentCard: card })).toBe(false);
  });

  it('shows the card after slide completes', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: card })).toBe(true);
  });

  it('is false with no card', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: null })).toBe(false);
  });
});
