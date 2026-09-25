export function cardNeedsHold(
  card: {
    cardType?: string;
    timerSeconds?: number;
    extraButton?: string;
    timerButtonLabel?: string;
  } | null,
): boolean {
  if (!card) return false;
  if (card.cardType === 'timer' || card.cardType === 'roll-again') return true;
  if ((card.timerSeconds ?? 0) > 0) return true;
  return Boolean(card.extraButton?.trim() || card.timerButtonLabel?.trim());
}

export function isCardHoldActive(opts: {
  currentCard: { timerSeconds?: number; extraButton?: string } | null;
  bodyVisible: boolean;
  released: boolean;
}): boolean {
  if (!opts.bodyVisible || opts.released) return false;
  return cardNeedsHold(opts.currentCard);
}

export function formatCardTimer(remainingSeconds: number): string {
  const clamped = Math.max(0, remainingSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
