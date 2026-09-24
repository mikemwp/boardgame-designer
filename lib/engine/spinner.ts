import type { SpinnerDef, SpinnerSegment } from './types';

export function sampleSegment(
  spinner: SpinnerDef,
  rng: () => number,
): SpinnerSegment | null {
  const segments = spinner.segments;
  if (segments.length === 0) return null;
  const weights =
    spinner.split === 'percent'
      ? segments.map((segment) => Math.max(0, segment.percent ?? 0))
      : segments.map(() => 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return segments[0] ?? null;
  let cursor = rng() * total;
  for (let i = 0; i < segments.length; i += 1) {
    cursor -= weights[i]!;
    if (cursor < 0) return segments[i]!;
  }
  return segments[segments.length - 1] ?? null;
}
