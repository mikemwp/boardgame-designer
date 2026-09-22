import { describe, it, expect } from 'vitest';
import {
  hasResolvableCard,
  isRollLocked,
  shouldShowDealtCard,
} from '@/lib/view/turn-loop';

const card = { id: '1', pack: 'climb', title: 'Rung', body: 'Clue' };

describe('hasResolvableCard', () => {
  it('is false with no card', () => {
    expect(hasResolvableCard({ currentCard: null, actionMode: 'both', awaitingAction: true })).toBe(false);
  });

  it('is true when awaiting Play or Pass', () => {
    expect(hasResolvableCard({ currentCard: card, actionMode: 'both', awaitingAction: true })).toBe(true);
  });

  it('is false after Play even if the card remains on screen', () => {
    expect(hasResolvableCard({ currentCard: card, actionMode: 'both', awaitingAction: false })).toBe(false);
  });

  it('is false when action mode is neither', () => {
    expect(hasResolvableCard({ currentCard: card, actionMode: 'neither', awaitingAction: true })).toBe(false);
  });
});

describe('isRollLocked', () => {
  it('locks while the token is sliding', () => {
    expect(isRollLocked({ tokenSliding: true, awaitingAction: false })).toBe(true);
  });

  it('locks while HUD dice or spinner is playing', () => {
    expect(isRollLocked({
      tokenSliding: false,
      awaitingAction: false,
      movementVizActive: true,
    })).toBe(true);
  });

  it('locks while awaiting Play or Pass', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: true })).toBe(true);
  });

  it('unlocks after Play even when the card body stays visible', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false })).toBe(false);
  });

  it('unlocks after Pass', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false })).toBe(false);
  });

  it('locks while a card timer or extra button is still holding', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false, cardHoldActive: true })).toBe(true);
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false, cardHoldActive: false })).toBe(false);
  });
});


describe('shouldShowDealtCard', () => {
  it('hides the card while sliding', () => {
    expect(shouldShowDealtCard({ tokenSliding: true, currentCard: card })).toBe(false);
  });

  it('hides the card while HUD movement viz is playing', () => {
    expect(shouldShowDealtCard({
      tokenSliding: false,
      currentCard: card,
      movementVizActive: true,
    })).toBe(false);
  });

  it('shows the card after slide completes', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: card })).toBe(true);
  });

  it('is false with no card', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: null })).toBe(false);
  });
});
