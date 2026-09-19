import { describe, it, expect } from 'vitest';
import { createGame, dispatch } from '@/lib/engine/game';
import { climbSample } from '@/lib/samples/climb';

describe('game dispatch', () => {
  it('rolls dice via engine before emitting event', () => {
    const game = createGame(climbSample, { diceEnabled: true, rng: () => 0.5 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastEvent?.type).toBe('DICE_ROLLED');
    expect(next.lastEvent?.value).toBeGreaterThanOrEqual(1);
  });
});
