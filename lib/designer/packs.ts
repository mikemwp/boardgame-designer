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

function rewriteHoldQuotas(
  holdQuotas: Record<string, number>,
  from: string,
  to: string | undefined,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(holdQuotas)) {
    if (key === from) continue;
    next[key] = value;
  }
  if (to !== undefined && from in holdQuotas) {
    next[to] = holdQuotas[from]!;
  }
  return next;
}

function rewriteBoardPack(board: Board, from: string, to: string | undefined): Board {
  return {
    ...board,
    floors: board.floors.map((floor) => {
      const cells = floor.cells.map((cell) => {
        if (cell.packId !== from) return cell;
        if (to === undefined) {
          const { packId: _removed, ...rest } = cell;
          return rest;
        }
        return { ...cell, packId: to };
      });
      if (!floor.holdQuotas) return { ...floor, cells };
      return { ...floor, holdQuotas: rewriteHoldQuotas(floor.holdQuotas, from, to), cells };
    }),
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
  patch: Partial<Pick<Card, 'title' | 'body' | 'timerSeconds' | 'extraButton' | 'audio'>>,
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
    if (patch.timerSeconds !== undefined) {
      if (Number.isNaN(patch.timerSeconds) || patch.timerSeconds <= 0) {
        delete next.timerSeconds;
      } else {
        next.timerSeconds = Math.floor(patch.timerSeconds);
      }
    }
    if (patch.extraButton !== undefined) {
      const extraButton = patch.extraButton.trim();
      if (extraButton) next.extraButton = extraButton;
      else delete next.extraButton;
    }
    if ('audio' in patch) {
      if (patch.audio) next.audio = patch.audio;
      else delete next.audio;
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
