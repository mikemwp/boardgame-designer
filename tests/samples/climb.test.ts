import { describe, it, expect } from 'vitest';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';
import { createGame, dispatch } from '@/lib/engine/game';

describe('climb sample', () => {
  it('is labeled as bundled sample only', () => {
    expect(CLIMB_LABEL).toContain('sample');
  });

  it('provides three looping floors of six cells', () => {
    expect(climbSample.board.floors).toHaveLength(3);
    for (const floor of climbSample.board.floors) {
      expect(floor.cells).toHaveLength(6);
    }
  });

  it('does not put packs on stair cells', () => {
    for (const floor of climbSample.board.floors) {
      for (const cell of floor.cells) {
        if (cell.kind === 'stair') {
          expect(cell.packId).toBeUndefined();
          expect(cell.stairId).toBeTruthy();
        }
      }
    }
  });

  it('has no bypass illegal stair from lobby to floor 2', () => {
    expect(climbSample.board.stairs.some((s) => s.id === 's0-bypass')).toBe(false);
  });

  it('does not deal a card until a content square is landed', () => {
    const game = createGame(climbSample);
    expect(game.cards.currentCard).toBeNull();
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll).not.toBeNull();
  });
});
