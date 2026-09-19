'use client';

import { useEffect, useState } from 'react';
import type { GameEvent } from '@/lib/engine/events';
import { DiceActor } from './DiceActor';

const SETTLE_MS = 1500;

export function DiceRollLayer({
  enabled,
  lastEvent,
}: {
  enabled: boolean;
  lastEvent: GameEvent | null;
}) {
  const [roll, setRoll] = useState<{ value: number; rolling: boolean } | null>(null);

  useEffect(() => {
    if (!enabled || lastEvent?.type !== 'DICE_ROLLED') return;
    setRoll({ value: lastEvent.value, rolling: true });
    const timer = window.setTimeout(() => {
      setRoll((current) => (current ? { ...current, rolling: false } : null));
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, lastEvent]);

  if (!enabled || !roll) return null;

  return <DiceActor targetValue={roll.value} rolling={roll.rolling} />;
}
