'use client';

import type { LastRoll as LastRollValue } from '@/lib/engine/game';

export function LastRoll({ lastRoll }: { lastRoll: LastRollValue | null }) {
  if (!lastRoll) {
    return <p className="text-slate-400">No roll yet</p>;
  }
  if (lastRoll.value === 0) {
    return <p>Last roll: 0 — stairs held</p>;
  }
  if (lastRoll.faces.length === 2) {
    return (
      <p>
        Last roll: {lastRoll.faces[0]} + {lastRoll.faces[1]} = {lastRoll.value} (2d6)
      </p>
    );
  }
  return <p>Last roll: {lastRoll.value} (d{lastRoll.sides})</p>;
}
