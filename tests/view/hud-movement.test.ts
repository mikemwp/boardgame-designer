import { describe, it, expect } from 'vitest';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  shouldShowMovementViz,
} from '@/lib/view/hud-movement';

describe('hud movement phase', () => {
  it('starts a tumble for a positive roll and stays idle for held 0', () => {
    expect(phaseAfterNewRoll(4)).toBe('tumble');
    expect(phaseAfterNewRoll(0)).toBe('idle');
  });

  it('token may slide only after tumble, and viz hides after slide', () => {
    expect(phaseAfterTumble('tumble')).toBe('slide');
    expect(phaseAfterTumble('idle')).toBe('idle');
    expect(shouldAllowTokenSlide('tumble')).toBe(false);
    expect(shouldAllowTokenSlide('slide')).toBe(true);
    expect(shouldShowMovementViz('tumble')).toBe(true);
    expect(shouldShowMovementViz('slide')).toBe(true);
    expect(shouldShowMovementViz('idle')).toBe(false);
    expect(phaseAfterSlide('slide')).toBe('idle');
    expect(isMovementVizActive('tumble')).toBe(true);
    expect(isMovementVizActive('slide')).toBe(true);
    expect(isMovementVizActive('idle')).toBe(false);
  });
});
