import { describe, it, expect } from 'vitest';
import { createGameStore } from '@/hooks/use-game-store';
import { climbSample } from '@/lib/samples/climb';

describe('createGameStore', () => {
  it('dispatches roll and stores lastRoll', () => {
    const store = createGameStore(climbSample);
    const next = store.dispatch({ type: 'ROLL_DICE' });
    expect(next.lastRoll).not.toBeNull();
    expect(next.lastRoll?.sides).toBeGreaterThanOrEqual(1);
  });
});
