'use client';

import type { LastRoll as LastRollValue } from '@/lib/engine/game';
import type { MovementViz } from '@/lib/engine/types';

export function LastRoll({
  lastRoll,
  movementViz = 'dice',
}: {
  lastRoll: LastRollValue | null;
  movementViz?: MovementViz;
}) {
  if (!lastRoll) {
    return <p className="text-slate-400">No roll yet</p>;
  }
  if (lastRoll.value === 0) {
    return <p>Last roll: 0 — stairs held</p>;
  }
  if (movementViz === 'spinner') {
    return <p>Last spin: {lastRoll.value} (1–{lastRoll.sides})</p>;
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
