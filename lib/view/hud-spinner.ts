export const HUD_SPINNER_MS = 1400;

export function spinnerMax(sides: number): 6 | 12 {
  return sides >= 12 ? 12 : 6;
}

export function spinnerLandingDegrees(value: number, max: 6 | 12, extraTurns = 4): number {
  const clamped = Math.min(max, Math.max(1, value));
  const slice = 360 / max;
  return extraTurns * 360 + (clamped - 1) * slice;
}
