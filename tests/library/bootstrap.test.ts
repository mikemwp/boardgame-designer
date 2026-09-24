import { describe, it, expect } from 'vitest';
import { createGame } from '@/lib/engine/game';
import { createCardState } from '@/lib/engine/cards';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import { listDraftPackIds } from '@/lib/designer/packs';
import {
  captureBootstrap,
  fromStoredBootstrap,
  storedPackIds,
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

  it('round-trips an empty pack catalog with no cards', () => {
    const stored = toStoredBootstrap(emptyBootstrap(), ['notes']);
    expect(stored.cards).toEqual([]);
    expect(stored.packs).toEqual(['notes']);
    const boot = fromStoredBootstrap(stored);
    expect(boot.cards.deck).toEqual([]);
    const again = toStoredBootstrap(boot, stored.packs);
    expect(again.packs).toEqual(['notes']);
    expect(listDraftPackIds(again.cards, again.packs ?? [])).toEqual(['notes']);
    expect(storedPackIds(stored)).toEqual(['notes']);
  });

  it('derives climb packs from the sample deck', () => {
    expect(toStoredBootstrap(climbSample).packs).toEqual(['climb']);
  });

  it('round-trips spinner and item catalogs with a tile spinnerId', () => {
    const boot = emptyBootstrap();
    boot.board.floors[0]!.cells[0] = {
      ...boot.board.floors[0]!.cells[0]!,
      spinnerId: 'spinner-1',
    };
    const stored = toStoredBootstrap({
      ...boot,
      spinners: [
        {
          id: 'spinner-1',
          name: 'Luck',
          split: 'equal',
          segments: [
            { id: 'a', label: 'Me' },
            { id: 'b', label: 'You' },
          ],
        },
      ],
      items: [{ id: 'item-1', name: 'Lock pick', starting: true }],
      itemAssign: 'choose',
    });
    expect(stored.spinners?.[0]?.name).toBe('Luck');
    expect(stored.items?.[0]).toMatchObject({ id: 'item-1', name: 'Lock pick', starting: true });
    expect(stored.itemAssign).toBe('choose');
    expect(stored.board.floors[0]?.cells[0]?.spinnerId).toBe('spinner-1');
    const restored = fromStoredBootstrap(stored);
    expect(restored.spinners?.[0]?.name).toBe('Luck');
    expect(restored.items?.[0]?.name).toBe('Lock pick');
    expect(restored.itemAssign).toBe('choose');
    expect(restored.board.floors[0]?.cells[0]?.spinnerId).toBe('spinner-1');
    const again = toStoredBootstrap(restored);
    expect(again.spinners).toEqual(stored.spinners);
    expect(again.items).toEqual(stored.items);
    expect(again.itemAssign).toBe('choose');
  });

  it('round-trips gameStart with the draft', () => {
    const gameStart = {
      audio: { id: 'g1', name: 'intro.mp3', source: 'url' as const, src: 'https://ex/intro.mp3' },
      splashes: [{ id: 's1', caption: 'Hello' }],
      menu: { items: [{ id: 'm1', label: 'Play', action: 'play' as const }] },
    };
    const stored = toStoredBootstrap({ ...emptyBootstrap(), gameStart });
    expect(stored.gameStart?.splashes[0]?.caption).toBe('Hello');
    expect(fromStoredBootstrap(stored).gameStart?.menu.items[0]?.action).toBe('play');
    const game = createGame(emptyBootstrap());
    const captured = captureBootstrap(game, stored.players, stored.packs, gameStart);
    expect(captured.gameStart?.audio?.id).toBe('g1');
  });
});
