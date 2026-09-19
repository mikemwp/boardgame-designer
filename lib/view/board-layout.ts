const FLOOR_HEIGHT = 2;
const CELL_SPACING = 1.5;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function cellToWorld(floorIndex: number, cellIndex: number): Vec3 {
  return { x: cellIndex * CELL_SPACING, y: floorIndex * FLOOR_HEIGHT, z: 0 };
}
