import { describe, it, expect } from 'vitest';
import {
  createCardState,
  revealCard,
  applyAction,
  countsTowardReveal,
  dealFromPack,
} from '@/lib/engine/cards';

const card = { id: '1', pack: 'climb', title: 'Rung' };
const rung = { id: '1', pack: 'climb', title: 'Rung', body: 'A foothold' };
const brick = { id: '2', pack: 'climb', title: 'Brick', body: 'Loose mortar' };

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

describe('dealFromPack', () => {
  it('sets currentCard without counting a reveal when actions are both', () => {
    const s = dealFromPack(createCardState([rung]), 'climb', 'both');
    expect(s.currentCard?.id).toBe('1');
    expect(s.bodyVisible).toBe(false);
    expect(s.revealedByPack.climb ?? 0).toBe(0);
  });

  it('counts a reveal immediately when actionMode is neither', () => {
    const s = dealFromPack(createCardState([rung]), 'climb', 'neither');
    expect(s.currentCard?.id).toBe('1');
    expect(s.bodyVisible).toBe(true);
    expect(s.revealedByPack.climb).toBe(1);
  });

  it('does not auto-deal when the pack is empty', () => {
    const s = dealFromPack(createCardState([]), 'climb', 'both');
    expect(s.currentCard).toBeNull();
  });
});

describe('applyAction after deal', () => {
  it('pass dismisses without counting a reveal', () => {
    let s = dealFromPack(createCardState([rung, brick]), 'climb', 'both');
    s = applyAction(s, 'pass', 'climb');
    expect(s.currentCard).toBeNull();
    expect(s.revealedByPack.climb ?? 0).toBe(0);
    expect(s.deck[s.deck.length - 1]?.id).toBe('1');
  });

  it('positive reveals body and counts once', () => {
    let s = dealFromPack(createCardState([rung]), 'climb', 'both');
    s = applyAction(s, 'positive', 'climb');
    expect(s.bodyVisible).toBe(true);
    expect(s.currentCard?.id).toBe('1');
    expect(s.revealedByPack.climb).toBe(1);
  });
});
