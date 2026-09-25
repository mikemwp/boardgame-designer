'use client';

import { spinnerTemplateOf } from '@/lib/designer/spinner-templates';
import type { SpinnerDef } from '@/lib/engine/types';
import {
  catalogSpinnerLandingDegrees,
  spinnerLandingDegrees,
  spinnerSegmentIndex,
  spinnerWeights,
} from '@/lib/view/hud-spinner';

const SLICE_COLORS = ['#334155', '#1e293b', '#475569', '#0f172a', '#64748b', '#1e3a5f'];

export function HudSpinner({
  value,
  max,
  spinning,
  rollId,
  spinner,
}: {
  value: number;
  max: 6 | 12;
  spinning: boolean;
  rollId: number;
  spinner?: SpinnerDef;
}) {
  const template = spinnerTemplateOf(spinner?.template);
  const segmentIndex = spinner ? spinnerSegmentIndex(spinner, value) : value - 1;
  const degrees = spinner
    ? catalogSpinnerLandingDegrees(spinner, segmentIndex)
    : spinnerLandingDegrees(value, max);
  const label = spinner
    ? `Spinner showing ${spinner.segments[segmentIndex]?.label ?? value}`
    : `Spinner showing ${value} of ${max}`;
  const ticks = spinner
    ? spinner.segments.map((segment) => segment.label)
    : Array.from({ length: max }, (_, i) => String(i + 1));
  const weights = spinner ? spinnerWeights(spinner) : ticks.map(() => 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;
  const gradient = ticks
    .map((_, i) => {
      const start = (cursor / total) * 360;
      cursor += weights[i] ?? 1;
      const end = (cursor / total) * 360;
      const color = SLICE_COLORS[i % SLICE_COLORS.length]!;
      return `${color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div
      className={`hud-spinner hud-spinner--${template.id}`}
      data-testid="hud-spinner"
      data-template={template.id}
      data-roll-id={rollId}
      role="img"
      aria-label={label}
    >
      <div className="hud-spinner-pointer" data-testid="spinner-pointer" />
      <div
        className={spinning ? 'hud-spinner-wheel hud-spinner-wheel--spin' : 'hud-spinner-wheel'}
        style={{
          ...(spinning
            ? {
                animationDuration: `${template.durationMs}ms`,
                animationTimingFunction: template.easing,
              }
            : { transform: `rotate(${degrees}deg)` }),
          background: spinner?.image?.src
            ? `url(${spinner.image.src}) center / cover`
            : `conic-gradient(from -90deg, ${gradient})`,
        }}
      >
        {ticks.map((tick, i) => {
          const start = weights.slice(0, i).reduce((sum, weight) => sum + weight, 0);
          const angle = ((start + (weights[i] ?? 1) / 2) / total) * 360;
          return (
            <span
              key={`${tick}-${i}`}
              className="hud-spinner-tick"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {tick}
            </span>
          );
        })}
      </div>
    </div>
  );
}
