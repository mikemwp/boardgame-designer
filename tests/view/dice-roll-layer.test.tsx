import { describe, it, expect } from 'vitest';
import { shouldShowDie } from '@/components/board/DiceRollLayer';

describe('shouldShowDie', () => {
  it('hides die for null or zero movement', () => {
    expect(shouldShowDie(null)).toBe(false);
    expect(shouldShowDie({ value: 0, sides: 6, id: 1, faces: [] })).toBe(false);
  });

  it('shows die for positive movement', () => {
    expect(shouldShowDie({ value: 3, sides: 6, id: 2, faces: [3] })).toBe(true);
  });
});
