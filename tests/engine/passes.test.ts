import { describe, it, expect } from 'vitest';
import {
  canSpendPass,
  createPassesLeft,
  formatPassesLeft,
  passActionAllowed,
  spendPass,
} from '@/lib/engine/passes';

describe('passes', () => {
  it('creates a per-pack quota copy', () => {
    expect(createPassesLeft({ climb: 1 })).toEqual({ climb: 1 });
  });

  it('spends one pass for the pack', () => {
    const left = createPassesLeft({ climb: 1 });
    expect(spendPass(left, 'climb')).toEqual({ climb: 0 });
    expect(canSpendPass({ climb: 0 }, 'climb')).toBe(false);
  });

  it('does not spend below zero', () => {
    expect(spendPass({ climb: 0 }, 'climb')).toEqual({ climb: 0 });
  });

  it('allows pass when budget is disabled', () => {
    expect(passActionAllowed('both', false, {}, 'climb')).toBe(true);
  });

  it('blocks pass when budget is enabled but empty', () => {
    expect(passActionAllowed('both', true, { climb: 0 }, 'climb')).toBe(false);
    expect(passActionAllowed('both', true, { climb: 1 }, 'climb')).toBe(true);
  });

  it('formats remaining passes for the HUD', () => {
    expect(formatPassesLeft({ climb: 1, loot: 0 })).toBe('climb 1, loot 0');
  });
});
