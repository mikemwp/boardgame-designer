import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import type { PlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';
import type { StoredBootstrap } from '@/lib/library/types';

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toStoredBootstrap(bootstrap: GameBootstrap): StoredBootstrap {
  return {
    board: cloneJson(bootstrap.board),
    players: cloneJson(bootstrap.players),
    cards: cloneJson(bootstrap.cards.deck),
    config: cloneJson({ ...defaultGameConfig(), ...bootstrap.config }),
  };
}

export function fromStoredBootstrap(stored: StoredBootstrap): GameBootstrap {
  return {
    board: cloneJson(stored.board),
    players: cloneJson(stored.players),
    cards: createCardState(cloneJson(stored.cards)),
    config: cloneJson({ ...defaultGameConfig(), ...stored.config }),
  };
}

export function captureBootstrap(
  game: Pick<GameState, 'board' | 'cards' | 'config'>,
  startPlayers: PlayerState,
): StoredBootstrap {
  return {
    board: cloneJson(game.board),
    players: cloneJson(startPlayers),
    cards: cloneJson(game.cards.deck),
    config: cloneJson(game.config),
  };
}
