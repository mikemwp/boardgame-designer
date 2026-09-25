export { tokenSideYaw } from '@/lib/designer/board-look';

/** CameraControls Pose.look pitch: looking down at XZ from +Y is negative. */
export const PREVIEW_ORBIT_PITCH = -85;
export const PREVIEW_ORBIT_PITCH_RANGE = { min: -89, max: -20 } as const;
export const PLAY_ORBIT_PITCH = PREVIEW_ORBIT_PITCH;
export const PLAY_ORBIT_PITCH_RANGE = PREVIEW_ORBIT_PITCH_RANGE;

export function orbitCameraPose(
  pivot: { x: number; y: number; z: number },
  distance: number,
  pitchDeg = PLAY_ORBIT_PITCH,
  yawDeg = 0,
): { position: [number, number, number]; rotation: [number, number, number] } {
  const elevationDeg = Math.abs(pitchDeg);
  const pitch = (elevationDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;
  const ox = distance * Math.cos(pitch) * Math.sin(yaw);
  const oy = distance * Math.sin(pitch);
  const oz = distance * Math.cos(pitch) * Math.cos(yaw);
  return {
    position: [pivot.x + ox, pivot.y + oy, pivot.z + oz],
    rotation: [pitchDeg < 0 ? pitchDeg : -elevationDeg, yawDeg, 0],
  };
}
