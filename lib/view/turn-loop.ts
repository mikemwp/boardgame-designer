import { allowedActions } from '@/lib/engine/cards';
import type { ActionMode, Card } from '@/lib/engine/types';

export function hasResolvableCard(opts: {
  currentCard: Card | null;
  actionMode: ActionMode;
  awaitingAction: boolean;
}): boolean {
  if (!opts.awaitingAction) return false;
  if (!opts.currentCard) return false;
  return allowedActions(opts.actionMode).length > 0;
}

export function isRollLocked(opts: {
  tokenSliding: boolean;
  awaitingAction: boolean;
}): boolean {
  if (opts.tokenSliding) return true;
  return opts.awaitingAction;
}

export function shouldShowDealtCard(opts: {
  tokenSliding: boolean;
  currentCard: Card | null;
}): boolean {
  if (!opts.currentCard) return false;
  return !opts.tokenSliding;
}
