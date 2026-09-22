'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Script } from '@playcanvas/react/components';
import { Vec2, Vec3 } from 'playcanvas';
import { CameraControls } from 'playcanvas/scripts/esm/camera-controls.mjs';
import { useMemo } from 'react';
import type { Board } from '@/lib/engine/board';
import { boardWorldBounds, orbitCameraLimits } from '@/lib/view/board-layout';

const DEFAULT_PITCH = 32;
const DEFAULT_YAW = 0;

function orbitCameraPose(
  pivot: Vec3,
  distance: number,
  pitchDeg = DEFAULT_PITCH,
  yawDeg = DEFAULT_YAW,
): { position: [number, number, number]; rotation: [number, number, number] } {
  const pitch = (pitchDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;
  const ox = distance * Math.cos(pitch) * Math.sin(yaw);
  const oy = distance * Math.sin(pitch);
  const oz = distance * Math.cos(pitch) * Math.cos(yaw);
  return {
    position: [pivot.x + ox, pivot.y + oy, pivot.z + oz],
    rotation: [-pitchDeg, yawDeg, 0],
  };
}

export function BoardOrbitCamera({ board }: { board: Board }) {
  const orbit = useMemo(() => {
    const limits = orbitCameraLimits(boardWorldBounds(board));
    const pivot = new Vec3(limits.pivot.x, limits.pivot.y, limits.pivot.z);
    return {
      pivot,
      pose: orbitCameraPose(pivot, limits.defaultDistance),
      zoomRange: new Vec2(limits.distanceMin, limits.distanceMax),
      pitchRange: new Vec2(12, 88),
    };
  }, [board]);

  return (
    <Entity name="camera" position={orbit.pose.position} rotation={orbit.pose.rotation}>
      <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
      <Script
        script={CameraControls}
        enableFly={false}
        enableOrbit
        enablePan={false}
        focusPoint={orbit.pivot}
        zoomRange={orbit.zoomRange}
        pitchRange={orbit.pitchRange}
        rotateDamping={0}
        zoomDamping={0}
        moveDamping={0}
        focusDamping={0}
      />
    </Entity>
  );
}
