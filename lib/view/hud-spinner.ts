import { spinnerTemplateOf } from '@/lib/designer/spinner-templates';
import type { SpinnerDef, SpinnerTemplateId } from '@/lib/engine/types';

export const HUD_SPINNER_MS = 1400;

export function spinnerMax(sides: number): 6 | 12 {
  return sides >= 12 ? 12 : 6;
}

export function spinnerLandingDegrees(value: number, max: 6 | 12, extraTurns = 4): number {
  const clamped = Math.min(max, Math.max(1, value));
  const slice = 360 / max;
  return extraTurns * 360 + (clamped - 1) * slice;
}

export function spinnerWeights(spinner: SpinnerDef): number[] {
  if (spinner.split === 'percent') {
    return spinner.segments.map((segment) => Math.max(0, segment.percent ?? 0) || 1);
  }
  return spinner.segments.map(() => 1);
}

export function spinnerSliceCenters(spinner: SpinnerDef): number[] {
  const weights = spinnerWeights(spinner);
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;
  return weights.map((weight) => {
    const start = (cursor / total) * 360;
    cursor += weight;
    return start + ((weight / total) * 360) / 2;
  });
}

export function catalogSpinnerLandingDegrees(
  spinner: SpinnerDef,
  segmentIndex: number,
  extraTurns = 4,
): number {
  const centers = spinnerSliceCenters(spinner);
  const center = centers[Math.max(0, Math.min(segmentIndex, centers.length - 1))] ?? 0;
  return extraTurns * 360 + (360 - center);
}

export function spinnerDurationMs(template?: SpinnerTemplateId): number {
  return spinnerTemplateOf(template).durationMs;
}

export function spinnerSegmentIndex(spinner: SpinnerDef, value: number): number {
  const idx = spinner.segments.findIndex((segment, index) => {
    const match = segment.label.match(/-?\d+/);
    if (match && Number(match[0]) === value) return true;
    return index + 1 === value;
  });
  return idx >= 0 ? idx : 0;
}
