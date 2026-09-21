import type { LastRoll } from '@/lib/engine/game';

export const DICE_TUMBLE_MS = 2000;
export const DICE_LINGER_AFTER_SETTLE_MS = 2500;

export function diceMinVisibleMs(): number {
  return DICE_TUMBLE_MS + DICE_LINGER_AFTER_SETTLE_MS;
}

export function isTumbling(elapsedMs: number): boolean {
  return elapsedMs < DICE_TUMBLE_MS;
}

export function shouldKeepDiceOnBoard(lastRoll: LastRoll | null, displayedRollId: number | null): boolean {
  if (!lastRoll || lastRoll.value < 1) return false;
  if (displayedRollId === null) return true;
  return displayedRollId === lastRoll.id;
}
