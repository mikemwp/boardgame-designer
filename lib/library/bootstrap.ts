import { listDraftPackIds } from '@/lib/designer/packs';
import { normalizeBoardRooms } from '@/lib/designer/rooms';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import type { PlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';
import type { GameStart, InventoryItem, ItemAssign, SpinnerDef } from '@/lib/engine/types';
import type { StoredBootstrap } from '@/lib/library/types';

function catalogFields(input: {
  spinners?: SpinnerDef[];
  items?: InventoryItem[];
  itemAssign?: ItemAssign;
}): Pick<StoredBootstrap, 'spinners' | 'items' | 'itemAssign'> {
  return {
    ...(input.spinners ? { spinners: cloneJson(input.spinners) } : {}),
    ...(input.items ? { items: cloneJson(input.items) } : {}),
    ...(input.itemAssign ? { itemAssign: input.itemAssign } : {}),
  };
}

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
    ...(bootstrap.gameStart ? { gameStart: cloneJson(bootstrap.gameStart) } : {}),
    ...catalogFields(bootstrap),
  };
}

export function fromStoredBootstrap(stored: StoredBootstrap): GameBootstrap {
  return {
    board: normalizeBoardRooms(cloneJson(stored.board)),
    players: cloneJson(stored.players),
    cards: createCardState(cloneJson(stored.cards)),
    config: cloneJson({ ...defaultGameConfig(), ...stored.config }),
    ...(stored.gameStart ? { gameStart: cloneJson(stored.gameStart) } : {}),
    ...catalogFields(stored),
  };
}

export function captureBootstrap(
  game: Pick<GameState, 'board' | 'cards' | 'config' | 'spinners' | 'items' | 'itemAssign'>,
  startPlayers: PlayerState,
  packIds: string[] = [],
  gameStart?: GameStart,
): StoredBootstrap {
  const cards = cloneJson(game.cards.deck);
  return {
    board: cloneJson(game.board),
    players: cloneJson(startPlayers),
    cards,
    packs: listDraftPackIds(cards, packIds),
    config: cloneJson(game.config),
    ...(gameStart ? { gameStart: cloneJson(gameStart) } : {}),
    ...catalogFields(game),
  };
}
