import type { Vec3 } from './board-layout';

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function slideDurationSeconds(distance: number): number {
  return Math.min(1.2, 0.25 + distance * 0.05);
}
