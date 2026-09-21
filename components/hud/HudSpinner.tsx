'use client';

import { spinnerLandingDegrees } from '@/lib/view/hud-spinner';

export function HudSpinner({
  value,
  max,
  spinning,
  rollId,
}: {
  value: number;
  max: 6 | 12;
  spinning: boolean;
  rollId: number;
}) {
  const degrees = spinnerLandingDegrees(value, max);
  const ticks = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div
      className="hud-spinner"
      data-testid="hud-spinner"
      data-roll-id={rollId}
      role="img"
      aria-label={`Spinner showing ${value} of ${max}`}
    >
      <div className="hud-spinner-pointer" />
      <div
        className={spinning ? 'hud-spinner-wheel hud-spinner-wheel--spin' : 'hud-spinner-wheel'}
        style={spinning ? undefined : { transform: `rotate(${degrees}deg)` }}
      >
        {ticks.map((n) => (
          <span
            key={n}
            className="hud-spinner-tick"
            style={{ transform: `rotate(${(n - 1) * (360 / max)}deg)` }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
