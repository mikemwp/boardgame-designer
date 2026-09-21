'use client';

import { useEffect, useState } from 'react';
import type { LastRoll } from '@/lib/engine/game';
import type { DiceCount } from '@/lib/engine/types';
import type { Vec3 } from '@/lib/view/board-layout';
import {
  diceDisplayFaces,
  diceSpawnOffsets,
  spawnPositionAboveFloor,
} from '@/lib/view/dice-throw';
import { DiceActor } from './DiceActor';

const SETTLE_MS = 1500;

export function shouldShowDie(lastRoll: LastRoll | null): boolean {
  return Boolean(lastRoll && lastRoll.value >= 1);
}

export function DiceRollLayer({
  enabled,
  lastRoll,
  diceCount,
  spawnAt,
}: {
  enabled: boolean;
  lastRoll: LastRoll | null;
  diceCount: DiceCount;
  spawnAt: Vec3;
}) {
  const [roll, setRoll] = useState<{ value: number; rolling: boolean; id: number } | null>(null);

  useEffect(() => {
    if (!enabled || !shouldShowDie(lastRoll) || !lastRoll) return;
    setRoll({ value: lastRoll.value, rolling: true, id: lastRoll.id });
    const timer = window.setTimeout(() => {
      setRoll((current) => (current ? { ...current, rolling: false } : null));
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, lastRoll?.id, lastRoll?.value, lastRoll]);

  if (!enabled || !roll) return null;

  const faces = diceDisplayFaces(roll.value, diceCount);
  const offsets = diceSpawnOffsets(diceCount);
  const base = spawnPositionAboveFloor(spawnAt);

  return (
    <>
      {faces.map((face, index) => {
        const [offsetX, offsetZ] = offsets[index] ?? [0, 0];
        return (
          <DiceActor
            key={`${roll.id}-${index}`}
            rollKey={roll.id}
            targetValue={face}
            rolling={roll.rolling}
            position={[base[0] + offsetX, base[1], base[2] + offsetZ]}
          />
        );
      })}
    </>
  );
}
