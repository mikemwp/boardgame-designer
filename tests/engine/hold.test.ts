import { describe, it, expect } from 'vitest';
import { createHoldState, recordHoldReveal, canExitHold } from '@/lib/engine/hold';
import { createGame, dispatch } from '@/lib/engine/game';
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import { addPlayer, createPlayerState } from '@/lib/engine/players';

describe('hold', () => {
  it('tracks per-pack reveals while on hold', () => {
    let h = createHoldState('f1', { climb: 2 });
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(false);
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(true);
  });
});

describe('hold through dispatch', () => {
  it('records reveal on neither-deal and exits when quota met', () => {
    const bootstrap = {
      board: createBoard(
        [{
          id: 'f1',
          index: 0,
          label: 'F1',
          holdEnabled: true,
          holdQuotas: { climb: 1 },
          cells: [
            { id: 'a', index: 0, kind: 'corridor' as const },
            { id: 'b', index: 1, kind: 'corridor' as const, packId: 'climb' },
          ],
        }],
        [],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'Climber',
        token: { floorId: 'f1', cellId: 'a' },
      }),
      cards: createCardState([{ id: 'c1', pack: 'climb', title: 'Clue' }]),
      config: { holdEnabled: true, actionMode: 'neither' as const, diceSides: 6, diceEnabled: false },
    };
    let game = createGame(bootstrap, { rng: () => 0 });
    game = { ...game, hold: { floorId: 'f1', quotas: { climb: 1 }, counts: {}, active: true } };
    game = dispatch(game, { type: 'ROLL_DICE' });
    expect(game.cards.currentCard?.id).toBe('c1');
    expect(game.cards.revealedByPack.climb).toBe(1);
    expect(game.hold).toBeNull();
  });
});
