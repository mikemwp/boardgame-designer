export const PLAY_ORBIT_PITCH = 32;
export const PREVIEW_ORBIT_PITCH = 85;
export const PREVIEW_ORBIT_PITCH_RANGE = { min: 25, max: 89 } as const;

export function orbitCameraPose(
  pivot: { x: number; y: number; z: number },
  distance: number,
  pitchDeg = PLAY_ORBIT_PITCH,
  yawDeg = 0,
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
