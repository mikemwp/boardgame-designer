'use client';

import { useEffect, useState } from 'react';
import type { LastRoll } from '@/lib/engine/game';
import { DiceActor } from './DiceActor';

const SETTLE_MS = 1500;

export function shouldShowDie(lastRoll: LastRoll | null): boolean {
  return Boolean(lastRoll && lastRoll.value >= 1);
}

export function DiceRollLayer({
  enabled,
  lastRoll,
}: {
  enabled: boolean;
  lastRoll: LastRoll | null;
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

  return <DiceActor targetValue={roll.value} rolling={roll.rolling} />;
}
