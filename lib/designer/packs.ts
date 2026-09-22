import type { Board } from '@/lib/engine/board';
import { listPackIds } from '@/lib/engine/layout';
import type { Card } from '@/lib/engine/types';

export function listDraftPackIds(cards: Array<{ pack: string }>, packIds: string[] = []): string[] {
  return listPackIds(cards, packIds);
}

export function nextPackId(existing: string[]): string {
  let n = 1;
  const used = new Set(existing);
  while (used.has(`pack-${n}`)) n += 1;
  return `pack-${n}`;
}

export function nextCardId(cards: Card[], packId: string): string {
  let n = 1;
  const used = new Set(cards.map((card) => card.id));
  while (used.has(`${packId}-${n}`)) n += 1;
  return `${packId}-${n}`;
}

export function createPack(packIds: string[], id: string): string[] {
  const trimmed = id.trim();
  if (!trimmed || packIds.includes(trimmed)) return packIds;
  return listDraftPackIds([], [...packIds, trimmed]);
}

function rewriteBoardPack(board: Board, from: string, to: string | undefined): Board {
  return {
    ...board,
    floors: board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => {
        if (cell.packId !== from) return cell;
        if (to === undefined) {
          const { packId: _removed, ...rest } = cell;
          return rest;
        }
        return { ...cell, packId: to };
      }),
    })),
  };
}

export function renamePack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  from: string;
  to: string;
}): { packIds: string[]; cards: Card[]; board: Board } {
  const to = input.to.trim();
  if (!to || to === input.from || input.packIds.includes(to)) {
    return { packIds: input.packIds, cards: input.cards, board: input.board };
  }
  return {
    packIds: listDraftPackIds(
      [],
      input.packIds.map((id) => (id === input.from ? to : id)),
    ),
    cards: input.cards.map((card) => (card.pack === input.from ? { ...card, pack: to } : card)),
    board: rewriteBoardPack(input.board, input.from, to),
  };
}

export function deletePack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  packId: string;
}): { packIds: string[]; cards: Card[]; board: Board } {
  return {
    packIds: input.packIds.filter((id) => id !== input.packId),
    cards: input.cards.filter((card) => card.pack !== input.packId),
    board: rewriteBoardPack(input.board, input.packId, undefined),
  };
}

export function addCard(cards: Card[], card: Card): Card[] {
  const title = card.title.trim();
  if (!title || cards.some((existing) => existing.id === card.id)) return cards;
  return [...cards, { ...card, title }];
}

export function updateCard(
  cards: Card[],
  cardId: string,
  patch: Partial<Pick<Card, 'title' | 'body'>>,
): Card[] {
  if (patch.title !== undefined && patch.title.trim().length === 0) return cards;
  return cards.map((card) => {
    if (card.id !== cardId) return card;
    const next = { ...card };
    if (patch.title !== undefined) next.title = patch.title.trim();
    if (patch.body !== undefined) {
      const body = patch.body.trim();
      if (body) next.body = body;
      else delete next.body;
    }
    return next;
  });
}

export function deleteCard(cards: Card[], cardId: string): Card[] {
  return cards.filter((card) => card.id !== cardId);
}

export function cardsInPack(cards: Card[], packId: string): Card[] {
  return cards.filter((card) => card.pack === packId);
}
