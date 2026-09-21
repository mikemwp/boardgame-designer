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
import { DICE_TUMBLE_MS, shouldKeepDiceOnBoard } from '@/lib/view/dice-lifetime';
import { DiceActor } from './DiceActor';

export function shouldShowDie(lastRoll: LastRoll | null): boolean {
  return Boolean(lastRoll && lastRoll.value >= 1);
}

interface DisplayedRoll {
  value: number;
  rolling: boolean;
  id: number;
  faces: number[];
  spawnAt: Vec3;
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
  const [roll, setRoll] = useState<DisplayedRoll | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!lastRoll || lastRoll.value < 1) {
      setRoll(null);
      return;
    }

    let startedNewRoll = false;
    setRoll((current) => {
      if (current?.id === lastRoll.id) return current;
      startedNewRoll = true;
      return {
        value: lastRoll.value,
        rolling: true,
        id: lastRoll.id,
        faces: [...lastRoll.faces],
        spawnAt: { x: spawnAt.x, y: spawnAt.y, z: spawnAt.z },
      };
    });

    if (!startedNewRoll) return;

    const tumbleTimer = window.setTimeout(() => {
      setRoll((current) =>
        current && current.id === lastRoll.id ? { ...current, rolling: false } : current,
      );
    }, DICE_TUMBLE_MS);

    return () => window.clearTimeout(tumbleTimer);
  }, [enabled, lastRoll?.id, lastRoll?.value, spawnAt.x, spawnAt.y, spawnAt.z]);

  if (!enabled || !roll || !shouldKeepDiceOnBoard(lastRoll, roll.id)) return null;

  const faces = diceDisplayFaces(roll.value, diceCount, roll.faces);
  const offsets = diceSpawnOffsets(diceCount);
  const base = spawnPositionAboveFloor(roll.spawnAt);

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
