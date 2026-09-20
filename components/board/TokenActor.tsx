'use client';

import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import { lerpVec3, slideDurationSeconds } from '@/lib/view/token-slide';
import type { Vec3 } from '@/lib/view/board-layout';

export function computeSlideFrame(from: Vec3, to: Vec3, t: number): Vec3 {
  return lerpVec3(from, to, Math.max(0, Math.min(1, t)));
}

export function TokenActor({ name, position }: { name: string; position: Vec3 }) {
  const material = useMaterial({ diffuse: '#f97316', roughness: 0.35, metalness: 0.1 });

  return (
    <Entity name={name} position={[position.x, position.y + 0.35, position.z]} scale={[0.35, 0.35, 0.35]}>
      <Render type="sphere" material={material} />
    </Entity>
  );
}

export function useTokenSlide(from: Vec3, to: Vec3, duration = slideDurationSeconds(1)) {
  return { from, to, duration };
}
