import { describe, it, expect } from 'vitest';
import { createCardState, revealCard, applyAction, countsTowardReveal } from '@/lib/engine/cards';

const card = { id: '1', pack: 'climb', title: 'Rung' };

describe('cards', () => {
  it('increments reveal count on positive reveal', () => {
    let s = createCardState([card]);
    s = revealCard(s, 'climb');
    expect(s.revealedByPack.climb).toBe(1);
  });

  it('pass does not count as reveal', () => {
    expect(countsTowardReveal('pass')).toBe(false);
    expect(countsTowardReveal('positive')).toBe(true);
    let s = createCardState([card]);
    s = applyAction(s, 'pass', 'climb');
    expect(s.revealedByPack.climb ?? 0).toBe(0);
  });
});
