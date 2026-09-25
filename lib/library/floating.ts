import type { FloatingPack } from '@/lib/designer/packs';
import { cardsInPack, listDraftPackIds } from '@/lib/designer/packs';
import type { Card } from '@/lib/engine/types';
import type { LibraryState } from '@/lib/library/types';

export type CopyPackSource =
  | { kind: 'game'; gameId: string; gameName: string; packName: string }
  | { kind: 'floating'; floatingId: string; packName: string };

export type CopyCardSource =
  | { kind: 'game'; gameId: string; gameName: string; packName: string; cardId: string; cardTitle: string }
  | { kind: 'floating'; cardId: string; cardTitle: string };

function nextFloatingId(prefix: string, used: string[]): string {
  let n = 1;
  while (used.includes(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

export function listCopyPackSources(state: LibraryState, currentGameId: string): CopyPackSource[] {
  const fromGames: CopyPackSource[] = [];
  for (const draft of state.drafts) {
    if (draft.id === currentGameId) continue;
    const packs = listDraftPackIds(draft.bootstrap.cards, draft.bootstrap.packs ?? []);
    for (const packName of packs) {
      fromGames.push({ kind: 'game', gameId: draft.id, gameName: draft.name, packName });
    }
  }
  const fromFloating: CopyPackSource[] = (state.floatingPacks ?? []).map((pack) => ({
    kind: 'floating' as const,
    floatingId: pack.id,
    packName: pack.name,
  }));
  return [...fromGames, ...fromFloating];
}

export function listCopyCardSources(state: LibraryState, currentGameId: string): CopyCardSource[] {
  const fromGames: CopyCardSource[] = [];
  for (const draft of state.drafts) {
    if (draft.id === currentGameId) continue;
    const packs = listDraftPackIds(draft.bootstrap.cards, draft.bootstrap.packs ?? []);
    for (const packName of packs) {
      for (const card of cardsInPack(draft.bootstrap.cards, packName)) {
        fromGames.push({
          kind: 'game',
          gameId: draft.id,
          gameName: draft.name,
          packName,
          cardId: card.id,
          cardTitle: card.title,
        });
      }
    }
  }
  const fromFloating: CopyCardSource[] = (state.floatingCards ?? []).map((card) => ({
    kind: 'floating' as const,
    cardId: card.id,
    cardTitle: card.title,
  }));
  return [...fromGames, ...fromFloating];
}

export function addFloatingPack(
  state: LibraryState,
  pack: Omit<FloatingPack, 'id'> & { id?: string },
): LibraryState {
  const existing = state.floatingPacks ?? [];
  const id = pack.id?.trim() || nextFloatingId('float-pack', existing.map((entry) => entry.id));
  const next: FloatingPack = { ...pack, id };
  return { ...state, floatingPacks: [...existing, next] };
}

export function addFloatingCard(state: LibraryState, card: Card | Omit<Card, 'id'> & { id?: string }): LibraryState {
  const existing = state.floatingCards ?? [];
  const id = card.id?.trim() || nextFloatingId('float-card', existing.map((entry) => entry.id));
  const next: Card = { pack: card.pack ?? '', title: card.title, ...card, id };
  return { ...state, floatingCards: [...existing, next] };
}

export function floatingPackById(state: LibraryState, id: string): FloatingPack | undefined {
  return (state.floatingPacks ?? []).find((pack) => pack.id === id);
}

export function floatingCardById(state: LibraryState, id: string): Card | undefined {
  return (state.floatingCards ?? []).find((card) => card.id === id);
}
