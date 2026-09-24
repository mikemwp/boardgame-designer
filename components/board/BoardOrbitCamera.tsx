'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Script } from '@playcanvas/react/components';
import { Vec2, Vec3 } from 'playcanvas';
import { CameraControls } from 'playcanvas/scripts/esm/camera-controls.mjs';
import { useMemo } from 'react';
import type { Board } from '@/lib/engine/board';
import { boardWorldBounds, orbitCameraLimits } from '@/lib/view/board-layout';
import {
  orbitCameraPose,
  PLAY_ORBIT_PITCH,
  PREVIEW_ORBIT_PITCH,
  PREVIEW_ORBIT_PITCH_RANGE,
} from '@/lib/view/orbit-camera';

export {
  orbitCameraPose,
  PLAY_ORBIT_PITCH,
  PREVIEW_ORBIT_PITCH,
  PREVIEW_ORBIT_PITCH_RANGE,
} from '@/lib/view/orbit-camera';

export function BoardOrbitCamera({
  board,
  view = 'play',
}: {
  board: Board;
  view?: 'play' | 'top-down';
}) {
  const orbit = useMemo(() => {
    const limits = orbitCameraLimits(boardWorldBounds(board));
    const pivot = new Vec3(limits.pivot.x, limits.pivot.y, limits.pivot.z);
    const pitch = view === 'top-down' ? PREVIEW_ORBIT_PITCH : PLAY_ORBIT_PITCH;
    const pitchRange = new Vec2(PREVIEW_ORBIT_PITCH_RANGE.min, PREVIEW_ORBIT_PITCH_RANGE.max);
    return {
      pivot,
      pose: orbitCameraPose(pivot, limits.defaultDistance, pitch),
      zoomRange: new Vec2(limits.distanceMin, limits.distanceMax),
      pitchRange,
    };
  }, [board, view]);

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
