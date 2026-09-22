import { listDraftPackIds } from '@/lib/designer/packs';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import type { PlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';
import type { StoredBootstrap } from '@/lib/library/types';

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function storedPackIds(stored: StoredBootstrap): string[] {
  return listDraftPackIds(stored.cards, stored.packs ?? []);
}

export function toStoredBootstrap(bootstrap: GameBootstrap, packIds: string[] = []): StoredBootstrap {
  const cards = cloneJson(bootstrap.cards.deck);
  return {
    board: cloneJson(bootstrap.board),
    players: cloneJson(bootstrap.players),
    cards,
    packs: listDraftPackIds(cards, packIds),
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
  packIds: string[] = [],
): StoredBootstrap {
  const cards = cloneJson(game.cards.deck);
  return {
    board: cloneJson(game.board),
    players: cloneJson(startPlayers),
    cards,
    packs: listDraftPackIds(cards, packIds),
    config: cloneJson(game.config),
  };
}
