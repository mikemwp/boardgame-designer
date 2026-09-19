import type { Card, ActionMode } from './types';

export interface CardState {
  deck: Card[];
  revealedByPack: Record<string, number>;
  currentCard: Card | null;
}

export function createCardState(cards: Card[]): CardState {
  return { deck: cards, revealedByPack: {}, currentCard: null };
}

export function countsTowardReveal(action: 'positive' | 'pass'): boolean {
  return action === 'positive';
}

export function revealCard(state: CardState, packId: string): CardState {
  const card = state.deck.find((c) => c.pack === packId);
  if (!card) return state;
  return {
    ...state,
    currentCard: card,
    revealedByPack: {
      ...state.revealedByPack,
      [packId]: (state.revealedByPack[packId] ?? 0) + 1,
    },
  };
}

export function applyAction(state: CardState, action: 'positive' | 'pass', packId: string): CardState {
  if (action === 'pass') {
    return { ...state, currentCard: null };
  }
  return revealCard(state, packId);
}

export function allowedActions(mode: ActionMode): Array<'positive' | 'pass'> {
  switch (mode) {
    case 'positive': return ['positive'];
    case 'pass': return ['pass'];
    case 'both': return ['positive', 'pass'];
    case 'neither': return [];
  }
}
