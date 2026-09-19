import type { Player, TokenPos } from './types';

export interface PlayerState {
  players: Player[];
  activePlayerId: string | null;
}

export function createPlayerState(): PlayerState {
  return { players: [], activePlayerId: null };
}

export function addPlayer(state: PlayerState, player: Player): PlayerState {
  const players = [...state.players, player];
  return {
    players,
    activePlayerId: state.activePlayerId ?? player.id,
  };
}

export function moveToken(state: PlayerState, playerId: string, pos: TokenPos): PlayerState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, token: pos } : p)),
  };
}

export function requireMinPlayers(state: PlayerState, min: number): boolean {
  return state.players.length >= min;
}
