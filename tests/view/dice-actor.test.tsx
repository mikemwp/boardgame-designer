import { describe, it, expect } from 'vitest';
import { faceRotationForValue } from '@/components/board/DiceActor';

describe('faceRotationForValue', () => {
  it('maps d6 values to euler presets', () => {
    expect(faceRotationForValue(1)).toEqual([0, 0, 0]);
    expect(faceRotationForValue(6)).toBeDefined();
  });
});
