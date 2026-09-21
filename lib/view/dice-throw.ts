import type { Vec3 } from '@/lib/view/board-layout';

export const DIE_HALF_EXTENT = 0.5;
export const FLOOR_HALF_HEIGHT = 0.1;
const SPAWN_CLEARANCE = 0.05;

export function spawnPositionAboveFloor(world: Vec3): [number, number, number] {
  const y = world.y + FLOOR_HALF_HEIGHT + DIE_HALF_EXTENT + SPAWN_CLEARANCE;
  return [world.x, y, world.z];
}

export interface ThrowImpulse {
  impulse: { x: number; y: number; z: number };
  torque: { x: number; y: number; z: number };
}

export function computeThrowImpulse(rng: () => number): ThrowImpulse {
  const upwardForce = 8 + rng() * 4;
  const horizontalForceX = (rng() - 0.5) * 5;
  const horizontalForceZ = (rng() - 0.5) * 5;
  const torqueX = (rng() - 0.5) * 20;
  const torqueY = (rng() - 0.5) * 20;
  const torqueZ = (rng() - 0.5) * 20;
  return {
    impulse: { x: horizontalForceX, y: upwardForce, z: horizontalForceZ },
    torque: { x: torqueX, y: torqueY, z: torqueZ },
  };
}

export function diceDisplayFaces(value: number, diceCount: 1 | 2): number[] {
  if (diceCount === 1) {
    return [Math.min(6, Math.max(1, value))];
  }
  const faceA = ((value - 1) % 6) + 1;
  const faceB = Math.min(6, Math.floor((value - 1) / 6) + 1);
  return [faceA, faceB];
}

export function diceSpawnOffsets(diceCount: 1 | 2): Array<[number, number]> {
  if (diceCount === 1) return [[0, 0]];
  return [[-0.35, 0], [0.35, 0]];
}
