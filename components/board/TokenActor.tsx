'use client';

import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { lerpVec3, slideDurationSeconds } from '@/lib/view/token-slide';
import type { Vec3 } from '@/lib/view/board-layout';

export function computeSlideFrame(from: Vec3, to: Vec3, t: number): Vec3 {
  return lerpVec3(from, to, Math.max(0, Math.min(1, t)));
}

export function TokenActor({ name, position }: { name: string; position: Vec3 }) {
  return (
    <Entity name={name} position={[position.x, position.y + 0.3, position.z]}>
      <Render type="sphere" />
    </Entity>
  );
}

export function useTokenSlide(from: Vec3, to: Vec3, duration = slideDurationSeconds(1)) {
  return { from, to, duration };
}
