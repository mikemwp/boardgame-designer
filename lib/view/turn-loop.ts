import { allowedActions } from '@/lib/engine/cards';
import type { ActionMode, Card } from '@/lib/engine/types';

export function hasResolvableCard(
  currentCard: Card | null,
  actionMode: ActionMode,
): boolean {
  if (!currentCard) return false;
  return allowedActions(actionMode).length > 0;
}

export function isRollLocked(opts: {
  tokenSliding: boolean;
  currentCard: Card | null;
  actionMode: ActionMode;
}): boolean {
  if (opts.tokenSliding) return true;
  return hasResolvableCard(opts.currentCard, opts.actionMode);
}

export function shouldShowDealtCard(opts: {
  tokenSliding: boolean;
  currentCard: Card | null;
}): boolean {
  if (!opts.currentCard) return false;
  return !opts.tokenSliding;
}
