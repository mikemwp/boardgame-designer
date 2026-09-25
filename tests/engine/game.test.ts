import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import { createGame, dispatch } from '@/lib/engine/game';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { climbSample } from '@/lib/samples/climb';
import type { GameBootstrap } from '@/lib/engine/game';
import { defaultGameConfig } from '@/lib/engine/types';

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

  it('awaits Enter or Pass on a room host and Pass stays on the corridor', () => {
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room', roomId: 'room-1', col: 1, row: 0, audio: { id: 'a1', name: 'room.mp3', source: 'url', src: 'https://ex/room.mp3' } },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'single' }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([{ id: 'n1', pack: 'notes', title: 'Clue' }]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    expect(landed.lastRoll?.value).toBe(1);
    expect(landed.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
    expect(landed.awaitingRoom).toEqual({ roomId: 'room-1', cellId: 'l1' });
    expect(landed.cards.currentCard).toBeNull();
    expect(dispatch(landed, { type: 'ROLL_DICE' })).toBe(landed);

    const passed = dispatch(landed, { type: 'PASS_ROOM' });
    expect(passed.awaitingRoom).toBeNull();
    expect(passed.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
    const continued = dispatch(passed, { type: 'ROLL_DICE' });
    expect(continued.players.players[0]?.token.cellId).toBe('l2');
  });

  it('plays host media on Enter for a single-tile room', () => {
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              {
                id: 'l1',
                index: 1,
                kind: 'room',
                roomId: 'room-1',
                col: 1,
                row: 0,
                packId: 'notes',
                audio: { id: 'a1', name: 'room.mp3', source: 'url', src: 'https://ex/room.mp3' },
              },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'single' }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([{ id: 'n1', pack: 'notes', title: 'Clue' }]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    const entered = dispatch(landed, { type: 'ENTER_ROOM' });
    expect(entered.awaitingRoom).toBeNull();
    expect(entered.players.players[0]?.token.cellId).toBe('l1');
    expect(entered.lastAudioCues.map((c) => c.target)).toEqual(['room']);
    expect(entered.cards.currentCard?.id).toBe('n1');
  });

  it('walks a multi-tile room until Leave on the entrance', () => {
    const interior = [
      { id: 'room-1-c0', index: 0, kind: 'corridor' as const, start: true, col: 0, row: 0 },
      { id: 'room-1-c1', index: 1, kind: 'corridor' as const, packId: 'notes', col: 1, row: 0 },
      { id: 'room-1-c2', index: 2, kind: 'corridor' as const, col: 2, row: 0 },
      { id: 'room-1-c3', index: 3, kind: 'corridor' as const, col: 0, row: 1 },
    ];
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room', roomId: 'room-1', col: 1, row: 0 },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'multi', shape: { kind: 'square', tilesPerSide: 3 }, cells: interior }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([{ id: 'n1', pack: 'notes', title: 'Clue' }]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    const entered = dispatch(landed, { type: 'ENTER_ROOM' });
    expect(entered.insideRoom).toEqual({ roomId: 'room-1', cellId: 'room-1-c0' });
    expect(entered.awaitingRoom).toBeNull();

    const walked = dispatch(entered, { type: 'ROLL_DICE' });
    expect(walked.insideRoom?.cellId).toBe('room-1-c1');
    expect(walked.cards.currentCard?.id).toBe('n1');

    const left = dispatch(entered, { type: 'LEAVE_ROOM' });
    expect(left.insideRoom).toBeNull();
    expect(left.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
  });

  it('auto-leaves when landing on a door again', () => {
    const interior = [
      { id: 'room-1-c0', index: 0, kind: 'door' as const, doorExit: 'auto-leave' as const, col: 0, row: 0 },
      { id: 'room-1-c1', index: 1, kind: 'corridor' as const, col: 1, row: 0 },
      { id: 'room-1-c2', index: 2, kind: 'corridor' as const, col: 1, row: 1 },
      { id: 'room-1-c3', index: 3, kind: 'corridor' as const, col: 0, row: 1 },
    ];
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room', roomId: 'room-1', col: 1, row: 0 },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'multi', shape: { kind: 'square', tilesPerSide: 3 }, cells: interior }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([]),
      config: { ...defaultGameConfig(), diceEnabled: true },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    const entered = dispatch(landed, { type: 'ENTER_ROOM' });
    expect(entered.insideRoom).toEqual({ roomId: 'room-1', cellId: 'room-1-c0' });
    const away = dispatch(entered, { type: 'ROLL_DICE' });
    expect(away.insideRoom?.cellId).toBeTruthy();
    expect(away.insideRoom?.cellId).not.toBe('room-1-c0');
    const back = dispatch(
      { ...away, insideRoom: { roomId: 'room-1', cellId: 'room-1-c3' }, rng: () => 0 },
      { type: 'ROLL_DICE' },
    );
    expect(back.insideRoom).toBeNull();
    expect(back.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
  });

  it('offers Leave or Stay when the door type is leave-or-stay', () => {
    const interior = [
      { id: 'room-1-c0', index: 0, kind: 'door' as const, doorExit: 'leave-or-stay' as const, col: 0, row: 0 },
      { id: 'room-1-c1', index: 1, kind: 'corridor' as const, col: 1, row: 0 },
      { id: 'room-1-c2', index: 2, kind: 'corridor' as const, col: 1, row: 1 },
      { id: 'room-1-c3', index: 3, kind: 'corridor' as const, col: 0, row: 1 },
    ];
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room', roomId: 'room-1', col: 1, row: 0 },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'multi', shape: { kind: 'square', tilesPerSide: 3 }, cells: interior }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([]),
      config: { ...defaultGameConfig(), diceEnabled: true },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    const entered = dispatch(landed, { type: 'ENTER_ROOM' });
    const away = dispatch(entered, { type: 'ROLL_DICE' });
    const back = dispatch(
      { ...away, insideRoom: { roomId: 'room-1', cellId: 'room-1-c3' }, rng: () => 0 },
      { type: 'ROLL_DICE' },
    );
    expect(back.awaitingDoorExit).toBe(true);
    expect(back.insideRoom?.cellId).toBe('room-1-c0');
    const stayed = dispatch(back, { type: 'STAY_ROOM' });
    expect(stayed.awaitingDoorExit).toBe(false);
    expect(stayed.insideRoom?.cellId).toBe('room-1-c0');
    const prompted = { ...back };
    const left = dispatch(prompted, { type: 'LEAVE_ROOM' });
    expect(left.insideRoom).toBeNull();
    expect(left.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
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

  it('sums two d6 in 2-dice mode (2-12, not spinner 1-12)', () => {
    const game = createGame(loopBootstrap(), { diceCount: 2, rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.sides).toBe(12);
    expect(next.lastRoll?.value).toBe(2);
    expect(next.lastRoll?.faces).toEqual([1, 1]);
  });

  it('can roll 12 as 6+6 in 2-dice mode', () => {
    let i = 0;
    const game = createGame(loopBootstrap(), {
      diceCount: 2,
      rng: () => (i++ === 0 ? 0.999 : 0.999),
    });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(12);
    expect(next.lastRoll?.faces).toEqual([6, 6]);
  });

  it('spinner two-range stores a uniform 1-12 lastRoll, not 2d6 faces', () => {
    const game = createGame(loopBootstrap(), {
      movementViz: 'spinner',
      diceCount: 2,
      rng: () => 0,
    });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.sides).toBe(12);
    expect(next.lastRoll?.value).toBe(1);
    expect(next.lastRoll?.faces).toEqual([1]);
  });
});

describe('PASS_CARD budget', () => {
  it('decrements remaining passes for the active player and pack', () => {
    let game = createGame(loopBootstrap(), {
      passesEnabled: true,
      passesPerPack: { climb: 1 },
      rng: () => 0,
    });
    game = dispatch(game, { type: 'ROLL_DICE' });
    game = dispatch(game, { type: 'PASS_CARD', packId: 'climb' });
    expect(game.players.players[0]?.passesLeftByPack?.climb).toBe(0);
    expect(game.cards.currentCard).toBeNull();
    expect(game.cards.bodyVisible).toBe(false);
    expect(game.cards.awaitingAction).toBe(false);
  });

  it('ignores pass when no passes remain', () => {
    let game = createGame(loopBootstrap(), {
      passesEnabled: true,
      passesPerPack: { climb: 1 },
      rng: () => 0,
    });
    game = dispatch(game, { type: 'ROLL_DICE' });
    game = dispatch(game, { type: 'PASS_CARD', packId: 'climb' });
    const blocked = dispatch(game, { type: 'ROLL_DICE' });
    const retried = dispatch(blocked, { type: 'PASS_CARD', packId: 'climb' });
    expect(retried).toEqual(blocked);
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

describe('outcome spin and inventory', () => {
  it('samples lastSpin when landing on a spinner tile', () => {
    const bootstrap = loopBootstrap();
    bootstrap.board.floors[0]!.cells[1] = {
      ...bootstrap.board.floors[0]!.cells[1]!,
      spinnerId: 'spinner-1',
    };
    const game = createGame(
      {
        ...bootstrap,
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
      },
      { rng: () => 0 },
    );
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastSpin).toMatchObject({
      spinnerId: 'spinner-1',
      spinnerName: 'Luck',
      label: 'Me',
    });
    expect(next.lastEvent?.type).toBe('CARD_DEALT');
  });

  it('SPIN_OUTCOME records lastSpin from a card spinner', () => {
    const game = createGame({
      ...loopBootstrap(),
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
    }, { rng: () => 0 });
    const next = dispatch(game, { type: 'SPIN_OUTCOME', spinnerId: 'spinner-1' });
    expect(next.lastSpin).toMatchObject({ spinnerName: 'Luck', label: 'Me' });
    expect(next.lastEvent).toEqual({ type: 'SPINNER_LANDED', spinnerId: 'spinner-1', label: 'Me' });
  });

  it('SET_INVENTORY applies the same kit to every player', () => {
    const players = addPlayer(
      addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      {
        id: 'p2',
        name: 'B',
        token: { floorId: 'lobby', cellId: 'l0' },
      },
    );
    const game = createGame({
      ...loopBootstrap(),
      players,
      items: [{ id: 'item-1', name: 'Lock pick', starting: true }],
      itemAssign: 'choose',
    });
    expect(game.players.players.map((p) => p.inventory)).toEqual([undefined, undefined]);
    const next = dispatch(game, { type: 'SET_INVENTORY', itemIds: ['item-1'] });
    expect(next.players.players.map((p) => p.inventory)).toEqual([['item-1'], ['item-1']]);
    expect(next.lastEvent?.type).toBe('INVENTORY_SET');
  });

  it('seeds every player with starting items when random', () => {
    const game = createGame({
      ...loopBootstrap(),
      items: [{ id: 'item-1', name: 'Lock pick', starting: true }],
      itemAssign: 'random',
    });
    expect(game.players.players[0]?.inventory).toEqual(['item-1']);
  });

  it('USE_ITEM decrements uses and destroys the item at 0', () => {
    const game = createGame({
      ...loopBootstrap(),
      items: [{ id: 'item-1', name: 'Lock pick', starting: true, usesRemaining: 2 }],
      itemAssign: 'random',
    });
    expect(game.players.players[0]?.itemUses).toEqual({ 'item-1': 2 });
    const once = dispatch(game, { type: 'USE_ITEM', itemId: 'item-1' });
    expect(once.lastEvent).toEqual({ type: 'ITEM_USED', itemId: 'item-1', usesLeft: 1 });
    const twice = dispatch(once, { type: 'USE_ITEM', itemId: 'item-1' });
    expect(twice.lastEvent).toEqual({ type: 'ITEM_DESTROYED', itemId: 'item-1' });
    expect(twice.players.players[0]?.inventory).toEqual([]);
  });
});

describe('climb sample still boots', () => {
  it('createGame(climbSample) has no current card', () => {
    const game = createGame(climbSample);
    expect(game.cards.currentCard).toBeNull();
  });
});

describe('lastAudioCues', () => {
  const clip = (id: string) => ({ id, name: `${id}.mp3`, source: 'url' as const, src: `https://ex/${id}.mp3` });

  it('starts with empty cues and cue id 0', () => {
    const game = createGame(loopBootstrap());
    expect(game.lastAudioCues).toEqual([]);
    expect(game.audioCueId).toBe(0);
  });

  it('records tile then card cues when landing a packed corridor with audio', () => {
    const bootstrap = loopBootstrap();
    bootstrap.board.floors[0]!.cells[1] = {
      ...bootstrap.board.floors[0]!.cells[1]!,
      audio: clip('tile'),
    };
    bootstrap.cards = createCardState([
      { id: 'climb-1', pack: 'climb', title: 'First Rung', body: 'A foothold', audio: clip('deal') },
    ]);
    const game = createGame(bootstrap, { rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastAudioCues.map((c) => c.target)).toEqual(['tile', 'card']);
    expect(next.audioCueId).toBe(game.audioCueId + 1);
  });

  it('records room cue on Enter, not on the host landing', () => {
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room', roomId: 'room-1', col: 1, row: 0, audio: clip('room') },
              { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'single' }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' },
    };
    const landed = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    expect(landed.lastAudioCues).toEqual([]);
    const entered = dispatch(landed, { type: 'ENTER_ROOM' });
    expect(entered.lastAudioCues.map((c) => c.target)).toEqual(['room']);
    expect(entered.lastAudioCues[0]?.ownerId).toBe('l1');
  });

  it('records stair then destination cues after a legal teleport', () => {
    const bootstrap = loopBootstrap();
    bootstrap.board.floors[0]!.cells[3] = {
      ...bootstrap.board.floors[0]!.cells[3]!,
      audio: clip('up'),
    };
    bootstrap.board.floors[1]!.cells[0] = {
      ...bootstrap.board.floors[1]!.cells[0]!,
      audio: clip('dest'),
    };
    bootstrap.cards = createCardState([
      { id: 'climb-1', pack: 'climb', title: 'First Rung', audio: clip('deal') },
    ]);
    const game = createGame(bootstrap, { rng: () => 0.35 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(3);
    expect(next.lastAudioCues.map((c) => c.target)).toEqual(['stair', 'tile', 'card']);
    expect(next.lastAudioCues[0]?.ownerId).toBe('l3');
    expect(next.lastAudioCues[1]?.ownerId).toBe('f1c0');
  });

  it('does not retrigger cues on Pass', () => {
    const bootstrap = loopBootstrap();
    bootstrap.board.floors[0]!.cells[1] = {
      ...bootstrap.board.floors[0]!.cells[1]!,
      audio: clip('tile'),
    };
    bootstrap.cards = createCardState([
      { id: 'climb-1', pack: 'climb', title: 'First Rung', audio: clip('deal') },
    ]);
    let game = createGame(bootstrap, { rng: () => 0 });
    game = dispatch(game, { type: 'ROLL_DICE' });
    const afterDeal = game.audioCueId;
    const cues = game.lastAudioCues;
    const passed = dispatch(game, { type: 'PASS_CARD', packId: 'climb' });
    expect(passed.audioCueId).toBe(afterDeal);
    expect(passed.lastAudioCues).toEqual(cues);
  });
});
