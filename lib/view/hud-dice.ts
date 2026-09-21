import type { LastRoll } from '@/lib/engine/game';
import type { DiceCount } from '@/lib/engine/types';

export const HUD_DICE_TUMBLE_MS = 1200;

const FACE_ROTATION: Record<number, { rotateX: number; rotateY: number }> = {
  1: { rotateX: 0, rotateY: 0 },
  2: { rotateX: 0, rotateY: -90 },
  3: { rotateX: 90, rotateY: 0 },
  4: { rotateX: -90, rotateY: 0 },
  5: { rotateX: 0, rotateY: 90 },
  6: { rotateX: 0, rotateY: 180 },
};

export function hudDieRotation(face: number): { rotateX: number; rotateY: number } {
  const clamped = Math.min(6, Math.max(1, face));
  return FACE_ROTATION[clamped] ?? FACE_ROTATION[1]!;
}

export function hudDiceFaces(lastRoll: LastRoll, diceCount: DiceCount): number[] {
  if (lastRoll.faces.length === diceCount) return [...lastRoll.faces];
  if (diceCount === 1) return [Math.min(6, Math.max(1, lastRoll.value))];
  const second = Math.min(6, Math.max(1, lastRoll.value - 1));
  return [1, second];
}
