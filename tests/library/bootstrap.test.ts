import { describe, it, expect } from 'vitest';
import { createGame } from '@/lib/engine/game';
import { createCardState } from '@/lib/engine/cards';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import {
  captureBootstrap,
  fromStoredBootstrap,
  toStoredBootstrap,
} from '@/lib/library/bootstrap';

describe('stored bootstrap codec', () => {
  it('round-trips Climb without rng and with a full GameConfig', () => {
    const stored = toStoredBootstrap(climbSample);
    expect(stored.cards.map((c) => c.id)).toEqual([
      'climb-1',
      'climb-2',
      'climb-3',
    ]);
    expect(stored.config.movementViz).toBe('dice');
    expect(stored.config.passesEnabled).toBe(true);
    const boot = fromStoredBootstrap(stored);
    expect(boot.rng).toBeUndefined();
    const game = createGame(boot);
    expect(game.board.floors).toHaveLength(3);
    expect(game.players.players[0]?.name).toBe('Climber');
    expect(game.config.movementViz).toBe('dice');
  });

  it('clones so mutating the stored copy cannot change climbSample', () => {
    const stored = toStoredBootstrap(climbSample);
    stored.cards.push({ id: 'injected', pack: 'climb', title: 'Nope' });
    stored.board.floors[0]!.label = 'Hacked';
    expect(climbSample.cards.deck).toHaveLength(3);
    expect(climbSample.board.floors[0]?.label).toBe('Lobby');
  });

  it('captureBootstrap keeps start players, live deck, and live config', () => {
    const start = toStoredBootstrap(emptyBootstrap()).players;
    const game = createGame(emptyBootstrap());
    game.cards = createCardState([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    game.config = { ...game.config, movementViz: 'spinner', diceCount: 2 };
    game.players.players[0]!.token = { floorId: 'ground', cellId: 'ground-c4' };
    const captured = captureBootstrap(game, start);
    expect(captured.cards).toEqual([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    expect(captured.config.movementViz).toBe('spinner');
    expect(captured.config.diceCount).toBe(2);
    expect(captured.players.players[0]?.token.cellId).toBe('ground-c0');
  });
});
