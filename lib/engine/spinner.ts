import type { SpinnerDef, SpinnerSegment } from './types';

export function segmentMoveValue(segment: SpinnerSegment, index: number): number {
  const match = segment.label.match(/-?\d+/);
  if (match) {
    const value = Number(match[0]);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return index + 1;
}

export function movementRangeForSpinner(spinner: SpinnerDef): { min: number; max: number } {
  const values = spinner.segments.map((segment, index) => segmentMoveValue(segment, index));
  if (values.length === 0) return { min: 1, max: 6 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function sampleSpinnerMove(
  spinner: SpinnerDef,
  allowed: number[],
  rng: () => number,
): { value: number; segment: SpinnerSegment | null } {
  const candidates = spinner.segments
    .map((segment, index) => ({ segment, value: segmentMoveValue(segment, index) }))
    .filter((entry) => allowed.includes(entry.value));
  if (candidates.length === 0) return { value: 0, segment: null };
  const picked = sampleSegment(
    { ...spinner, segments: candidates.map((entry) => entry.segment) },
    rng,
  );
  const match = candidates.find((entry) => entry.segment.id === picked?.id) ?? candidates[0]!;
  return { value: match.value, segment: match.segment };
}

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
