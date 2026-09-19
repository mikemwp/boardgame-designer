import { defaultGameConfig, type GameConfig } from './types';
import { createBoard, type Board } from './board';
import { createPlayerState, addPlayer, moveToken, type PlayerState } from './players';
import { rollInteger, createDiceRollEvent, type Rng } from './dice';
import { createCardState, applyAction, type CardState } from './cards';
import { createHoldState, canExitHold, type HoldState } from './hold';
import { sampleStairLanding } from './movement';
import type { GameCommand, GameEvent } from './events';

export interface GameState {
  config: GameConfig;
  board: Board;
  players: PlayerState;
  cards: CardState;
  hold: HoldState | null;
  lastEvent: GameEvent | null;
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
    rng: overrides?.rng ?? bootstrap.rng ?? Math.random,
  };
}

export function dispatch(state: GameState, cmd: GameCommand): GameState {
  switch (cmd.type) {
    case 'ROLL_DICE': {
      if (!state.config.diceEnabled) return state;
      const value = rollInteger(state.config.diceSides, state.rng);
      return { ...state, lastEvent: createDiceRollEvent(value, state.config.diceSides) };
    }
    case 'PASS_CARD':
      return { ...state, cards: applyAction(state.cards, 'pass', cmd.packId), lastEvent: null };
    case 'REVEAL_CARD':
      return { ...state, cards: applyAction(state.cards, 'positive', cmd.packId), lastEvent: null };
    case 'MOVE_SAMPLE_STAIR': {
      const active = state.players.activePlayerId;
      if (!active) return state;
      const player = state.players.players.find((p) => p.id === active);
      if (!player) return state;
      const landing = sampleStairLanding(state.board, player.token.floorId, state.rng);
      if (!landing) return state;
      const players = moveToken(state.players, active, { floorId: landing.toFloorId, cellId: landing.toCellId });
      let hold = state.hold;
      if (state.config.holdEnabled) {
        const floor = state.board.floors.find((f) => f.id === landing.toFloorId);
        if (floor?.holdEnabled) hold = createHoldState(floor.id, { climb: 1 });
      }
      return {
        ...state,
        players,
        hold,
        lastEvent: { type: 'TOKEN_MOVED', playerId: active, floorId: landing.toFloorId, cellId: landing.toCellId },
      };
    }
    default:
      return state;
  }
}

export function tryExitHold(state: GameState): GameState {
  if (!state.hold || !canExitHold(state.hold)) return state;
  return { ...state, hold: null, lastEvent: { type: 'HOLD_EXITED' } };
}
