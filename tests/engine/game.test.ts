import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import { createGame, dispatch } from '@/lib/engine/game';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { climbSample } from '@/lib/samples/climb';
import type { GameBootstrap } from '@/lib/engine/game';

function loopBootstrap(overrides?: Partial<GameBootstrap>): GameBootstrap {
  const floors = [
    {
      id: 'lobby',
      index: 0,
      label: 'Lobby',
      cells: [
        { id: 'l0', index: 0, kind: 'corridor' as const },
        { id: 'l1', index: 1, kind: 'corridor' as const, packId: 'climb' },
        { id: 'l2', index: 2, kind: 'corridor' as const },
        { id: 'l3', index: 3, kind: 'stair' as const, stairId: 'up' },
      ],
    },
    {
      id: 'f1',
      index: 1,
      label: 'Floor 1',
      holdEnabled: true,
      holdQuotas: { climb: 1 },
      cells: [
        { id: 'f1c0', index: 0, kind: 'corridor' as const, packId: 'climb' },
        { id: 'f1c1', index: 1, kind: 'stair' as const, stairId: 'up2' },
      ],
    },
    {
      id: 'f2',
      index: 2,
      label: 'Floor 2',
      cells: [{ id: 'f2c0', index: 0, kind: 'corridor' as const }],
    },
  ];
  const stairs = [
    { id: 'up', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1c0', legal: true },
    { id: 'up2', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'f2c0', legal: true },
  ];
  return {
    board: createBoard(floors, stairs),
    players: addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'Climber',
      token: { floorId: 'lobby', cellId: 'l0' },
    }),
    cards: createCardState([
      { id: 'climb-1', pack: 'climb', title: 'First Rung', body: 'A foothold' },
    ]),
    config: { diceEnabled: true, holdEnabled: true, actionMode: 'both', diceSides: 6 },
    ...overrides,
  };
}

describe('createGame', () => {
  it('does not auto-deal a card', () => {
    const game = createGame(loopBootstrap());
    expect(game.cards.currentCard).toBeNull();
    expect(game.lastRoll).toBeNull();
  });
});

describe('ROLL_DICE', () => {
  it('stores lastRoll even when lastEvent is no longer only DICE_ROLLED', () => {
    const game = createGame(loopBootstrap(), { rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBeGreaterThanOrEqual(0);
    expect(next.lastRoll?.sides).toBe(6);
    expect(next.lastRoll?.id).toBe(1);
  });

  it('moves along the loop and deals on a content landing', () => {
    const game = createGame(loopBootstrap(), { rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(1);
    expect(next.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
    expect(next.cards.currentCard?.id).toBe('climb-1');
    expect(next.cards.revealedByPack.climb ?? 0).toBe(0);
    expect(next.lastEvent?.type).toBe('CARD_DEALT');
  });

  it('takes an unlocked stair and enters hold on a hold floor', () => {
    const game = createGame(loopBootstrap(), { rng: () => 0.35 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(3);
    if (next.lastRoll?.value === 3) {
      expect(next.players.players[0]?.token.floorId).toBe('f1');
      expect(next.hold?.floorId).toBe('f1');
      expect(next.hold?.active).toBe(true);
      expect(next.cards.currentCard?.pack).toBe('climb');
    }
  });

  it('returns movement 0 when every face is a held exit stair', () => {
    const held: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'f1',
            index: 0,
            label: 'Held',
            holdEnabled: true,
            holdQuotas: { climb: 1 },
            cells: [{ id: 's', index: 0, kind: 'stair', stairId: 'up' }],
          },
          { id: 'f2', index: 1, label: 'Next', cells: [{ id: 'n', index: 0 }] },
        ],
        [{ id: 'up', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'n', legal: true }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'Climber',
        token: { floorId: 'f1', cellId: 's' },
      }),
      cards: createCardState([]),
      config: { holdEnabled: true, diceSides: 6, actionMode: 'both', diceEnabled: true },
    };
    const game = createGame(held);
    game.hold = { floorId: 'f1', quotas: { climb: 1 }, counts: {}, active: true };
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(0);
    expect(next.players.players[0]?.token).toEqual({ floorId: 'f1', cellId: 's' });
  });

  it('still moves when 3D dice viz is disabled', () => {
    const game = createGame(loopBootstrap(), { diceEnabled: false, rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.players.players[0]?.token.cellId).toBe('l1');
  });
});

describe('card actions and hold', () => {
  it('Pass does not unlock hold; Play does', () => {
    let game = createGame(loopBootstrap(), { rng: () => 0 });
    game = dispatch(game, { type: 'ROLL_DICE' });
    game = {
      ...game,
      hold: { floorId: 'lobby', quotas: { climb: 1 }, counts: {}, active: true },
    };
    const passed = dispatch(game, { type: 'PASS_CARD', packId: 'climb' });
    expect(passed.hold?.active).toBe(true);
    expect(passed.cards.revealedByPack.climb ?? 0).toBe(0);

    const dealt = dispatch(passed, { type: 'ROLL_DICE' });
    const played = dispatch(dealt, { type: 'REVEAL_CARD', packId: 'climb' });
    expect(played.cards.revealedByPack.climb).toBeGreaterThanOrEqual(1);
    expect(played.hold).toBeNull();
  });
});

describe('climb sample still boots', () => {
  it('createGame(climbSample) has no current card', () => {
    const game = createGame(climbSample);
    expect(game.cards.currentCard).toBeNull();
  });
});
