'use client';

import { useEffect } from 'react';
import type { LastRoll } from '@/lib/engine/game';
import type { DiceCount, MovementViz, SpinnerDef } from '@/lib/engine/types';
import { HudDice } from '@/components/hud/HudDice';
import { HudSpinner } from '@/components/hud/HudSpinner';
import { HUD_DICE_TUMBLE_MS, hudDiceFaces } from '@/lib/view/hud-dice';
import {
  type MovementPhase,
  shouldShowMovementViz,
} from '@/lib/view/hud-movement';
import { spinnerDurationMs, spinnerMax } from '@/lib/view/hud-spinner';

export function MovementStage({
  viz,
  lastRoll,
  diceCount,
  phase,
  onTumbleComplete,
  spinner,
}: {
  viz: MovementViz;
  lastRoll: LastRoll | null;
  diceCount: DiceCount;
  phase: MovementPhase;
  onTumbleComplete: () => void;
  spinner?: SpinnerDef;
}) {
  const visible = Boolean(
    shouldShowMovementViz(phase) && lastRoll && lastRoll.value >= 1,
  );

  useEffect(() => {
    if (!visible || phase !== 'tumble' || !lastRoll) return;
    const ms = viz === 'spinner' ? spinnerDurationMs(spinner?.template) : HUD_DICE_TUMBLE_MS;
    const timer = window.setTimeout(() => onTumbleComplete(), ms);
    return () => window.clearTimeout(timer);
  }, [visible, phase, lastRoll?.id, viz, onTumbleComplete, lastRoll, spinner?.template]);

  if (!visible || !lastRoll) return null;

  if (viz === 'spinner') {
    return (
      <HudSpinner
        value={lastRoll.value}
        max={spinnerMax(lastRoll.sides)}
        spinning={phase === 'tumble'}
        rollId={lastRoll.id}
        spinner={spinner}
      />
    );
  }

  return (
    <HudDice
      faces={hudDiceFaces(lastRoll, diceCount)}
      tumbling={phase === 'tumble'}
      rollId={lastRoll.id}
    />
  );
}
