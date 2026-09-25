import { spinnerTemplateOf } from '@/lib/designer/spinner-templates';
import type { SpinnerDef } from '@/lib/engine/types';
import { spinnerSegmentIndex, spinnerWeights } from '@/lib/view/hud-spinner';

export const SPIN_WHEEL_SLICE_COLORS = [
  '#334155',
  '#1e293b',
  '#475569',
  '#0f172a',
  '#64748b',
  '#1e3a5f',
];

export type SpinWheelItem = {
  label: string;
  backgroundColor: string;
  value: string | number;
  weight: number;
};

export type SpinToItemArgs = {
  itemIndex: number;
  duration: number;
  spinToCenter: true;
  numberOfRevolutions: 4;
  direction: 1;
  easingFunction: (n: number) => number;
};

export function wheelItemsFromSpinner(spinner: SpinnerDef): SpinWheelItem[] {
  const weights = spinnerWeights(spinner);
  return spinner.segments.map((segment, index) => ({
    label: segment.label,
    backgroundColor: SPIN_WHEEL_SLICE_COLORS[index % SPIN_WHEEL_SLICE_COLORS.length]!,
    value: segment.id,
    weight: weights[index] ?? 1,
  }));
}

export function wheelItemsFromMax(max: 6 | 12): SpinWheelItem[] {
  return Array.from({ length: max }, (_, index) => ({
    label: String(index + 1),
    backgroundColor: SPIN_WHEEL_SLICE_COLORS[index % SPIN_WHEEL_SLICE_COLORS.length]!,
    value: index + 1,
    weight: 1,
  }));
}

export function wheelProps(options: { items: SpinWheelItem[]; isInteractive: boolean }): {
  items: SpinWheelItem[];
  isInteractive: boolean;
  pointerAngle: 0;
  itemBackgroundColors: string[];
  itemLabelColors: ['#e2e8f0'];
  itemLabelFont: string;
  borderWidth: number;
  lineWidth: number;
} {
  return {
    items: options.items,
    isInteractive: options.isInteractive,
    pointerAngle: 0,
    itemBackgroundColors: [...SPIN_WHEEL_SLICE_COLORS],
    itemLabelColors: ['#e2e8f0'],
    itemLabelFont: 'sans-serif',
    borderWidth: 4,
    lineWidth: 1,
  };
}

export function easingFromCss(easing: string): (n: number) => number {
  const match = easing.match(
    /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/,
  );
  if (!match) return (n) => Math.sin((Math.min(1, Math.max(0, n)) * Math.PI) / 2);
  return unitBezier(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]));
}

export function spinToItemArgs(
  spinner: SpinnerDef | undefined,
  value: number,
  max: 6 | 12,
): SpinToItemArgs {
  const template = spinnerTemplateOf(spinner?.template);
  const itemIndex = spinner ? spinnerSegmentIndex(spinner, value) : Math.max(0, value - 1);
  return {
    itemIndex,
    duration: template.durationMs,
    spinToCenter: true,
    numberOfRevolutions: 4,
    direction: 1,
    easingFunction: easingFromCss(template.easing),
  };
}

function unitBezier(x1: number, y1: number, x2: number, y2: number): (n: number) => number {
  return (n) => {
    const t = Math.min(1, Math.max(0, n));
    if (t === 0 || t === 1) return t;
    let guess = t;
    for (let i = 0; i < 8; i += 1) {
      const currentX = sampleCurve(guess, x1, x2);
      const delta = currentX - t;
      if (Math.abs(delta) < 1e-6) break;
      const dx = sampleCurveDerivative(guess, x1, x2);
      if (Math.abs(dx) < 1e-6) break;
      guess -= delta / dx;
    }
    return sampleCurve(guess, y1, y2);
  };
}

function sampleCurve(t: number, p1: number, p2: number): number {
  const c = 3 * p1;
  const b = 3 * (p2 - p1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
}

function sampleCurveDerivative(t: number, p1: number, p2: number): number {
  const c = 3 * p1;
  const b = 3 * (p2 - p1) - c;
  const a = 1 - c - b;
  return (3 * a * t + 2 * b) * t + c;
}
