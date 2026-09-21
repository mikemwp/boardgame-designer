import { describe, it, expect } from 'vitest';
import { shouldShowDie } from '@/components/board/DiceRollLayer';

describe('shouldShowDie', () => {
  it('hides the die when movement is 0', () => {
    expect(shouldShowDie({ value: 0, sides: 6, id: 2, faces: [] })).toBe(false);
    expect(shouldShowDie({ value: 4, sides: 6, id: 2, faces: [4] })).toBe(true);
    expect(shouldShowDie(null)).toBe(false);
  });
});
