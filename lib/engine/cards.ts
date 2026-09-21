import type { ActionMode, Card } from './types';

export interface CardState {
  deck: Card[];
  revealedByPack: Record<string, number>;
  currentCard: Card | null;
  bodyVisible: boolean;
}

export function createCardState(cards: Card[]): CardState {
  return { deck: cards, revealedByPack: {}, currentCard: null, bodyVisible: false };
}

export function countsTowardReveal(action: 'positive' | 'pass'): boolean {
  return action === 'positive';
}

export function cycleToBottom(deck: Card[], cardId: string): Card[] {
  const idx = deck.findIndex((c) => c.id === cardId);
  if (idx < 0) return deck;
  const card = deck[idx];
  if (!card) return deck;
  return [...deck.slice(0, idx), ...deck.slice(idx + 1), card];
}

export function revealCard(state: CardState, packId: string): CardState {
  const card = state.deck.find((c) => c.pack === packId);
  if (!card) return state;
  return {
    ...state,
    currentCard: card,
    bodyVisible: true,
    revealedByPack: {
      ...state.revealedByPack,
      [packId]: (state.revealedByPack[packId] ?? 0) + 1,
    },
  };
}

export function dealFromPack(state: CardState, packId: string, actionMode: ActionMode): CardState {
  let deck = state.deck;
  if (state.currentCard) {
    deck = cycleToBottom(deck, state.currentCard.id);
  }
  const card = deck.find((c) => c.pack === packId);
  if (!card) {
    return { ...state, deck, currentCard: null, bodyVisible: false };
  }
  const neither = actionMode === 'neither';
  return {
    ...state,
    deck,
    currentCard: card,
    bodyVisible: neither,
    revealedByPack: neither
      ? { ...state.revealedByPack, [packId]: (state.revealedByPack[packId] ?? 0) + 1 }
      : state.revealedByPack,
  };
}

export function applyAction(state: CardState, action: 'positive' | 'pass', packId: string): CardState {
  if (action === 'pass') {
    const deck = state.currentCard ? cycleToBottom(state.deck, state.currentCard.id) : state.deck;
    return { ...state, deck, currentCard: null, bodyVisible: false };
  }
  if (!state.currentCard) {
    return revealCard(state, packId);
  }
  const pack = state.currentCard.pack;
  return {
    ...state,
    bodyVisible: true,
    revealedByPack: {
      ...state.revealedByPack,
      [pack]: (state.revealedByPack[pack] ?? 0) + 1,
    },
  };
}

export function allowedActions(mode: ActionMode): Array<'positive' | 'pass'> {
  switch (mode) {
    case 'positive': return ['positive'];
    case 'pass': return ['pass'];
    case 'both': return ['positive', 'pass'];
    case 'neither': return [];
  }
}
