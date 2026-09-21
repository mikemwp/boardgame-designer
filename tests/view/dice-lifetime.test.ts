import { describe, it, expect } from 'vitest';
import {
  DICE_LINGER_AFTER_SETTLE_MS,
  DICE_TUMBLE_MS,
  diceMinVisibleMs,
  isTumbling,
  shouldKeepDiceOnBoard,
} from '@/lib/view/dice-lifetime';

describe('dice lifetime', () => {
  it('tumbles then settles', () => {
    expect(isTumbling(0)).toBe(true);
    expect(isTumbling(DICE_TUMBLE_MS - 1)).toBe(true);
    expect(isTumbling(DICE_TUMBLE_MS)).toBe(false);
  });

  it('requires tumble plus linger minimum on screen', () => {
    expect(diceMinVisibleMs()).toBe(DICE_TUMBLE_MS + DICE_LINGER_AFTER_SETTLE_MS);
    expect(diceMinVisibleMs()).toBeGreaterThanOrEqual(4000);
  });

  it('keeps dice until a new roll id replaces them', () => {
    expect(shouldKeepDiceOnBoard({ value: 4, sides: 6, id: 2, faces: [4] }, 2)).toBe(true);
    expect(shouldKeepDiceOnBoard({ value: 5, sides: 6, id: 3, faces: [5] }, 2)).toBe(false);
    expect(shouldKeepDiceOnBoard(null, 2)).toBe(false);
    expect(shouldKeepDiceOnBoard({ value: 0, sides: 6, id: 2, faces: [] }, 2)).toBe(false);
  });
});
