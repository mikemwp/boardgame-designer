import { allowedActions } from './cards';
import type { ActionMode } from './types';

export type PassesByPack = Record<string, number>;

export function createPassesLeft(quotas: PassesByPack): PassesByPack {
  return { ...quotas };
}

export function canSpendPass(passesLeft: PassesByPack, packId: string): boolean {
  return (passesLeft[packId] ?? 0) > 0;
}

export function spendPass(passesLeft: PassesByPack, packId: string): PassesByPack {
  const left = passesLeft[packId] ?? 0;
  if (left <= 0) return passesLeft;
  return { ...passesLeft, [packId]: left - 1 };
}

export function passActionAllowed(
  actionMode: ActionMode,
  passesEnabled: boolean,
  passesLeft: PassesByPack,
  packId: string,
): boolean {
  if (!allowedActions(actionMode).includes('pass')) return false;
  if (!passesEnabled) return true;
  return canSpendPass(passesLeft, packId);
}

export function formatPassesLeft(passesLeft: PassesByPack): string {
  return Object.entries(passesLeft)
    .map(([pack, left]) => `${pack} ${left}`)
    .join(', ');
}
