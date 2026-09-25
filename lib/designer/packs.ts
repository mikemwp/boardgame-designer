import type { Board } from '@/lib/engine/board';
import { createBoard } from '@/lib/engine/board';
import { listPackIds } from '@/lib/engine/layout';
import type { Card, ImageRef } from '@/lib/engine/types';

export interface FloatingPack {
  id: string;
  name: string;
  cards: Card[];
  backImage?: ImageRef;
}

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

export function uniquePackName(existing: string[], desired: string): string | null {
  const trimmed = desired.trim();
  if (!trimmed) return null;
  if (!existing.includes(trimmed)) return trimmed;
  let n = 2;
  while (existing.includes(`${trimmed} ${n}`)) n += 1;
  return `${trimmed} ${n}`;
}

export function createPack(packIds: string[], id: string): string[] {
  const trimmed = id.trim();
  if (!trimmed || packIds.includes(trimmed)) return packIds;
  return listDraftPackIds([], [...packIds, trimmed]);
}

function cloneCard(card: Card): Card {
  return JSON.parse(JSON.stringify(card)) as Card;
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

function rewriteCellPack<T extends { packId?: string }>(cell: T, from: string, to: string | undefined): T {
  if (cell.packId !== from) return cell;
  if (to === undefined) {
    const { packId: _removed, ...rest } = cell;
    return rest as T;
  }
  return { ...cell, packId: to };
}

function rewriteBoardPack(board: Board, from: string, to: string | undefined): Board {
  const floors = board.floors.map((floor) => {
    const cells = floor.cells.map((cell) => rewriteCellPack(cell, from, to));
    if (!floor.holdQuotas) return { ...floor, cells };
    return { ...floor, holdQuotas: rewriteHoldQuotas(floor.holdQuotas, from, to), cells };
  });
  const rooms = board.rooms?.map((room) => {
    if (!room.cells) return room;
    return { ...room, cells: room.cells.map((cell) => rewriteCellPack(cell, from, to)) };
  });
  return createBoard(floors, board.stairs, rooms);
}

function rewritePackBacks(
  packBacks: Record<string, ImageRef> | undefined,
  from: string,
  to: string | undefined,
): Record<string, ImageRef> {
  const next: Record<string, ImageRef> = {};
  for (const [key, value] of Object.entries(packBacks ?? {})) {
    if (key === from) continue;
    next[key] = value;
  }
  if (to !== undefined && packBacks && from in packBacks) {
    next[to] = packBacks[from]!;
  }
  return next;
}

export function setPackBack(
  packBacks: Record<string, ImageRef> | undefined,
  packId: string,
  image: ImageRef | undefined,
): Record<string, ImageRef> {
  const next = { ...(packBacks ?? {}) };
  if (!image) {
    delete next[packId];
    return next;
  }
  next[packId] = image;
  return next;
}

export function cardBackImage(card: Card, packBack?: ImageRef): ImageRef | undefined {
  return card.image ?? packBack;
}

export function renamePack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  packBacks?: Record<string, ImageRef>;
  from: string;
  to: string;
}): { packIds: string[]; cards: Card[]; board: Board; packBacks: Record<string, ImageRef> } {
  const to = input.to.trim();
  const packBacks = input.packBacks ?? {};
  if (!to || to === input.from || input.packIds.includes(to)) {
    return { packIds: input.packIds, cards: input.cards, board: input.board, packBacks };
  }
  return {
    packIds: listDraftPackIds(
      [],
      input.packIds.map((id) => (id === input.from ? to : id)),
    ),
    cards: input.cards.map((card) => (card.pack === input.from ? { ...card, pack: to } : card)),
    board: rewriteBoardPack(input.board, input.from, to),
    packBacks: rewritePackBacks(packBacks, input.from, to),
  };
}

export function deletePack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  packBacks?: Record<string, ImageRef>;
  packId: string;
}): { packIds: string[]; cards: Card[]; board: Board; packBacks: Record<string, ImageRef> } {
  return {
    packIds: input.packIds.filter((id) => id !== input.packId),
    cards: input.cards.filter((card) => card.pack !== input.packId),
    board: rewriteBoardPack(input.board, input.packId, undefined),
    packBacks: rewritePackBacks(input.packBacks, input.packId, undefined),
  };
}

export function copyPack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  packBacks?: Record<string, ImageRef>;
  source: { name: string; cards: Card[]; backImage?: ImageRef };
}): { packIds: string[]; cards: Card[]; board: Board; packBacks: Record<string, ImageRef> } {
  const name = uniquePackName(input.packIds, input.source.name);
  if (!name) {
    return {
      packIds: input.packIds,
      cards: input.cards,
      board: input.board,
      packBacks: input.packBacks ?? {},
    };
  }
  const packIds = createPack(input.packIds, name);
  let cards = input.cards;
  for (const card of input.source.cards) {
    cards = copyCard(cards, name, card);
  }
  return {
    packIds,
    cards,
    board: input.board,
    packBacks: setPackBack(input.packBacks, name, input.source.backImage),
  };
}

export function removePack(input: {
  packIds: string[];
  cards: Card[];
  board: Board;
  packBacks?: Record<string, ImageRef>;
  packId: string;
}): {
  packIds: string[];
  cards: Card[];
  board: Board;
  packBacks: Record<string, ImageRef>;
  floating: FloatingPack;
} {
  const cards = cardsInPack(input.cards, input.packId).map(cloneCard);
  const floating: FloatingPack = {
    id: `float-pack-${crypto.randomUUID()}`,
    name: input.packId,
    cards,
    ...(input.packBacks?.[input.packId] ? { backImage: input.packBacks[input.packId] } : {}),
  };
  return { ...deletePack(input), floating };
}

export function copyCard(cards: Card[], packId: string, source: Card): Card[] {
  const clone = cloneCard(source);
  clone.id = nextCardId(cards, packId);
  clone.pack = packId;
  return addCard(cards, clone);
}

export function removeCard(cards: Card[], cardId: string): { cards: Card[]; floating: Card } {
  const current = cards.find((card) => card.id === cardId);
  const floating = cloneCard(current ?? { id: cardId, pack: '', title: 'Card' });
  floating.id = `float-card-${crypto.randomUUID()}`;
  return { cards: deleteCard(cards, cardId), floating };
}

export function addCard(cards: Card[], card: Card): Card[] {
  const title = card.title.trim();
  if (!title || cards.some((existing) => existing.id === card.id)) return cards;
  return [...cards, { ...card, title }];
}

export function updateCard(
  cards: Card[],
  cardId: string,
  patch: Partial<
    Pick<
      Card,
      | 'title'
      | 'body'
      | 'cardType'
      | 'moveSteps'
      | 'continueLabel'
      | 'turnLabel'
      | 'timerSeconds'
      | 'timerButtonLabel'
      | 'extraButton'
      | 'audio'
      | 'spinnerId'
      | 'itemId'
      | 'image'
    >
  >,
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
    if ('cardType' in patch) {
      if (patch.cardType) next.cardType = patch.cardType;
      else delete next.cardType;
      if (patch.cardType === 'timer' && !next.timerButtonLabel) next.timerButtonLabel = 'Start timer';
    }
    if (patch.moveSteps !== undefined) {
      if (Number.isNaN(patch.moveSteps) || patch.moveSteps <= 0) delete next.moveSteps;
      else next.moveSteps = Math.floor(patch.moveSteps);
    }
    if (patch.continueLabel !== undefined) {
      const label = patch.continueLabel.trim();
      if (label) next.continueLabel = label;
      else delete next.continueLabel;
    }
    if (patch.turnLabel !== undefined) {
      const label = patch.turnLabel.trim();
      if (label) next.turnLabel = label;
      else delete next.turnLabel;
    }
    if (patch.timerButtonLabel !== undefined) {
      const label = patch.timerButtonLabel.trim();
      if (label) next.timerButtonLabel = label;
      else delete next.timerButtonLabel;
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
      if (extraButton) next.extraButton = patch.extraButton.trim();
      else delete next.extraButton;
    }
    if ('audio' in patch) {
      if (patch.audio) next.audio = patch.audio;
      else delete next.audio;
    }
    if ('spinnerId' in patch) {
      if (patch.spinnerId) next.spinnerId = patch.spinnerId;
      else delete next.spinnerId;
    }
    if ('itemId' in patch) {
      if (patch.itemId) next.itemId = patch.itemId;
      else delete next.itemId;
    }
    if ('image' in patch) {
      if (patch.image) next.image = patch.image;
      else delete next.image;
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
