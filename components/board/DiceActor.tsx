'use client';

import { Entity } from '@playcanvas/react';
import { Collision, RigidBody, Render } from '@playcanvas/react/components';
import { useParent } from '@playcanvas/react/hooks';
import { useEffect, useRef } from 'react';
import { BODYTYPE_STATIC, Vec3 } from 'playcanvas';
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

function DiceThrower({
  rolling,
  rollKey,
  targetValue,
}: {
  rolling: boolean;
  rollKey: number;
  targetValue: number;
}) {
  const entity = useParent();
  const thrownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!entity.rigidbody) return;

    if (rolling) {
      if (thrownRef.current === rollKey) return;
      thrownRef.current = rollKey;
      const rb = entity.rigidbody;
      rb.type = 'dynamic';
      rb.linearVelocity = Vec3.ZERO;
      rb.angularVelocity = Vec3.ZERO;
      const { impulse, torque } = computeThrowImpulse(Math.random);
      rb.applyImpulse(impulse.x, impulse.y, impulse.z);
      rb.applyTorqueImpulse(torque.x, torque.y, torque.z);
      return;
    }

    thrownRef.current = null;
    const rb = entity.rigidbody;
    const pos = entity.getPosition();
    const rot = faceRotationForValue(targetValue);
    entity.setEulerAngles(rot[0], rot[1], rot[2]);
    rb.teleport(pos, entity.getRotation());
    rb.linearVelocity = Vec3.ZERO;
    rb.angularVelocity = Vec3.ZERO;
    rb.type = BODYTYPE_STATIC;
  }, [rolling, rollKey, targetValue, entity]);

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
      <DiceThrower rolling={rolling} rollKey={rollKey} targetValue={targetValue} />
    </Entity>
  );
}
