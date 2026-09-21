import { defaultGameConfig, type GameConfig, type TokenPos } from './types';
import { getFloor, type Board } from './board';
import { moveToken, type PlayerState } from './players';
import { diceSidesForCount, type Rng } from './dice';
import { applyAction, countsTowardReveal, dealFromPack, type CardState } from './cards';
import { canExitHold, createHoldState, recordHoldReveal, type HoldState } from './hold';
import { allowedMoveValues, sampleMoveValue, walkSteps } from './movement';
import type { GameCommand, GameEvent } from './events';

export interface LastRoll {
  value: number;
  sides: number;
  id: number;
}

export interface GameState {
  config: GameConfig;
  board: Board;
  players: PlayerState;
  cards: CardState;
  hold: HoldState | null;
  lastEvent: GameEvent | null;
  lastRoll: LastRoll | null;
  rng: Rng;
}

export interface GameBootstrap {
  board: Board;
  players: PlayerState;
  cards: CardState;
  config?: Partial<GameConfig>;
  rng?: Rng;
}

export function createGame(bootstrap: GameBootstrap, overrides?: Partial<GameConfig> & { rng?: Rng }): GameState {
  return {
    config: { ...defaultGameConfig(), ...bootstrap.config, ...overrides },
    board: bootstrap.board,
    players: bootstrap.players,
    cards: bootstrap.cards,
    hold: null,
    lastEvent: null,
    lastRoll: null,
    rng: overrides?.rng ?? bootstrap.rng ?? Math.random,
  };
}

export function tryExitHold(state: GameState): GameState {
  if (!state.hold || !canExitHold(state.hold)) return state;
  return { ...state, hold: null, lastEvent: { type: 'HOLD_EXITED' } };
}

function dealOnLand(state: GameState, packId: string): GameState {
  const cards = dealFromPack(state.cards, packId, state.config.actionMode);
  let hold = state.hold;
  if (hold && state.config.actionMode === 'neither' && cards.currentCard) {
    hold = recordHoldReveal(hold, packId);
  }
  const lastEvent: GameEvent = cards.currentCard
    ? { type: 'CARD_DEALT', packId, cardId: cards.currentCard.id }
    : state.lastEvent;
  return tryExitHold({ ...state, cards, hold, lastEvent });
}

function afterMove(state: GameState, playerId: string, landing: TokenPos): GameState {
  const floor = getFloor(state.board, landing.floorId);
  const cell = floor?.cells.find((c) => c.id === landing.cellId);
  if (!cell) return state;

  if (cell.kind === 'stair' && cell.stairId) {
    const stair = state.board.stairs.find((s) => s.id === cell.stairId);
    const heldExit = Boolean(
      state.config.holdEnabled && state.hold?.active && state.hold.floorId === landing.floorId,
    );
    if (!stair || !stair.legal || heldExit) {
      return {
        ...state,
        lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: landing.floorId, cellId: landing.cellId },
      };
    }
    const dest: TokenPos = { floorId: stair.toFloorId, cellId: stair.toCellId };
    const players = moveToken(state.players, playerId, dest);
    const destFloor = getFloor(state.board, dest.floorId);
    let hold = state.hold;
    let lastEvent: GameEvent = {
      type: 'TOKEN_MOVED',
      playerId,
      floorId: dest.floorId,
      cellId: dest.cellId,
    };
    if (state.config.holdEnabled && destFloor?.holdEnabled) {
      hold = createHoldState(destFloor.id, destFloor.holdQuotas ?? { climb: 1 });
      lastEvent = { type: 'HOLD_ENTERED', floorId: destFloor.id };
    }
    const moved: GameState = { ...state, players, hold, lastEvent };
    const destCell = destFloor?.cells.find((c) => c.id === dest.cellId);
    if (destCell?.packId && destCell.kind !== 'stair') {
      return dealOnLand(moved, destCell.packId);
    }
    return moved;
  }

  if (cell.packId) {
    return dealOnLand(state, cell.packId);
  }

  return {
    ...state,
    lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: landing.floorId, cellId: landing.cellId },
  };
}

export function dispatch(state: GameState, cmd: GameCommand): GameState {
  switch (cmd.type) {
    case 'ROLL_DICE': {
      const active = state.players.activePlayerId;
      if (!active) return state;
      const player = state.players.players.find((p) => p.id === active);
      if (!player) return state;
      const sides = diceSidesForCount(state.config.diceCount);
      const allowed = allowedMoveValues(
        state.board,
        player.token,
        sides,
        state.hold,
        state.config.holdEnabled,
      );
      const value = sampleMoveValue(allowed, state.rng);
      const lastRoll: LastRoll = { value, sides, id: (state.lastRoll?.id ?? 0) + 1 };
      const rolled: GameState = {
        ...state,
        lastRoll,
        lastEvent: { type: 'DICE_ROLLED', value, sides },
      };
      if (value === 0) return rolled;
      const floor = getFloor(state.board, player.token.floorId);
      if (!floor) return rolled;
      const landingCell = walkSteps(floor, player.token.cellId, value);
      if (!landingCell) return rolled;
      const landing: TokenPos = { floorId: player.token.floorId, cellId: landingCell.id };
      const players = moveToken(rolled.players, active, landing);
      return afterMove({ ...rolled, players }, active, landing);
    }
    case 'PASS_CARD':
      return { ...state, cards: applyAction(state.cards, 'pass', cmd.packId) };
    case 'REVEAL_CARD': {
      const cards = applyAction(state.cards, 'positive', cmd.packId);
      let hold = state.hold;
      if (hold && countsTowardReveal('positive')) {
        hold = recordHoldReveal(hold, cmd.packId);
      }
      return tryExitHold({ ...state, cards, hold });
    }
    default:
      return state;
  }
}
