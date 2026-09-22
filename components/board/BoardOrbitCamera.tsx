'use client';

import { Entity } from '@playcanvas/react';
import { Camera } from '@playcanvas/react/components';
import { OrbitControls } from '@playcanvas/react/scripts';
import { Vec3 } from 'playcanvas';
import { useMemo } from 'react';
import type { Board } from '@/lib/engine/board';
import { boardWorldBounds, orbitCameraLimits } from '@/lib/view/board-layout';

export function BoardOrbitCamera({ board }: { board: Board }) {
  const orbit = useMemo(() => {
    const limits = orbitCameraLimits(boardWorldBounds(board));
    return {
      pivot: new Vec3(limits.pivot.x, limits.pivot.y, limits.pivot.z),
      distanceMin: limits.distanceMin,
      distanceMax: limits.distanceMax,
      distance: limits.defaultDistance,
    };
  }, [board]);

  return (
    <Entity name="camera" position={[0, 7, 10]} rotation={[-32, 0, 0]}>
      <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
      <OrbitControls
        frameOnStart={false}
        pivotPoint={orbit.pivot}
        distanceMin={orbit.distanceMin}
        distanceMax={orbit.distanceMax}
        distance={orbit.distance}
        pitchAngleMin={12}
        pitchAngleMax={88}
        mouse={{ orbitSensitivity: 0.3, distanceSensitivity: 0.25 }}
        touch={{ orbitSensitivity: 0.4, distanceSensitivity: 0.25 }}
      />
    </Entity>
  );
}
