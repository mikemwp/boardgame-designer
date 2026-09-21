'use client';

import { Entity } from '@playcanvas/react';
import { Collision, RigidBody, Render } from '@playcanvas/react/components';
import { useParent } from '@playcanvas/react/hooks';
import { useEffect } from 'react';
import { Vec3 } from 'playcanvas';
import { computeThrowImpulse, DIE_HALF_EXTENT } from '@/lib/view/dice-throw';

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

function DiceThrower({ rolling, rollKey }: { rolling: boolean; rollKey: number }) {
  const entity = useParent();

  useEffect(() => {
    if (!rolling || !entity.rigidbody) return;
    const rb = entity.rigidbody;
    rb.linearVelocity = Vec3.ZERO;
    rb.angularVelocity = Vec3.ZERO;
    const { impulse, torque } = computeThrowImpulse(Math.random);
    rb.applyImpulse(impulse.x, impulse.y, impulse.z);
    rb.applyTorqueImpulse(torque.x, torque.y, torque.z);
  }, [rolling, rollKey, entity]);

  useEffect(() => {
    if (rolling || !entity.rigidbody) return;
    const rb = entity.rigidbody;
    rb.linearVelocity = Vec3.ZERO;
    rb.angularVelocity = Vec3.ZERO;
  }, [rolling, entity]);

  return null;
}

export function DiceActor({
  targetValue,
  rolling,
  rollKey,
  position,
}: {
  targetValue: number;
  rolling: boolean;
  rollKey: number;
  position: [number, number, number];
}) {
  const rotation: [number, number, number] = rolling ? [0, 0, 0] : faceRotationForValue(targetValue);
  return (
    <Entity name="die" rotation={rotation} position={position}>
      <Render type="box" />
      <Collision type="box" halfExtents={[DIE_HALF_EXTENT, DIE_HALF_EXTENT, DIE_HALF_EXTENT]} />
      <RigidBody type="dynamic" mass={0.05} restitution={0.35} friction={0.6} />
      <DiceThrower rolling={rolling} rollKey={rollKey} />
    </Entity>
  );
}
