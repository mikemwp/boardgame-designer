'use client';

import { Entity } from '@playcanvas/react';
import { Collision, RigidBody, Render } from '@playcanvas/react/components';

const D6_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, 0, 90],
  3: [90, 0, 0],
  4: [-90, 0, 0],
  5: [0, 0, -90],
  6: [180, 0, 0],
};

export function faceRotationForValue(value: number): [number, number, number] {
  return D6_ROTATIONS[value] ?? [0, 0, 0];
}

export function DiceActor({ targetValue, rolling }: { targetValue: number; rolling: boolean }) {
  const rotation: [number, number, number] = rolling ? [0, 0, 0] : faceRotationForValue(targetValue);
  return (
    <Entity name="die" rotation={rotation} position={[0, 1.5, 0]}>
      <Render type="box" />
      <Collision type="box" halfExtents={[0.25, 0.25, 0.25]} />
      <RigidBody type="dynamic" mass={0.05} restitution={0.35} friction={0.6} />
    </Entity>
  );
}
