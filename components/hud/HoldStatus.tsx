'use client';

import type { HoldState } from '@/lib/engine/hold';

export function HoldStatus({ hold, floorLabel }: { hold: HoldState | null; floorLabel: string }) {
  if (!hold?.active) return null;
  const parts = Object.entries(hold.quotas).map(([pack, quota]) => {
    const count = hold.counts[pack] ?? 0;
    return `${pack} ${count}/${quota}`;
  });
  return (
    <p className="text-sm text-amber-200">
      Held on {floorLabel}: {parts.join(', ')}. Stairs locked.
    </p>
  );
}
