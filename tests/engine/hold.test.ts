import { describe, it, expect } from 'vitest';
import { createHoldState, recordHoldReveal, canExitHold } from '@/lib/engine/hold';

describe('hold', () => {
  it('tracks per-pack reveals while on hold', () => {
    let h = createHoldState('f1', { climb: 2 });
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(false);
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(true);
  });
});
