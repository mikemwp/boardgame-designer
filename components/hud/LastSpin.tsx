'use client';

import type { LastSpin as LastSpinValue } from '@/lib/engine/game';

export function LastSpin({ lastSpin }: { lastSpin: LastSpinValue | null }) {
  if (!lastSpin) return <p className="text-sm text-slate-400">No outcome spin yet</p>;
  return (
    <p className="text-sm text-slate-200" data-testid="last-spin">
      Last spin: {lastSpin.label} ({lastSpin.spinnerName})
    </p>
  );
}
