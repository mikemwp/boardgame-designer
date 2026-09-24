/** Signed area of a closed XZ polyline. Negative is clockwise from +Y. */
export function xzSignedArea(points: Array<{ x: number; z: number }>): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    area += a.x * b.z - b.x * a.z;
  }
  return area;
}

/** Clockwise around the XZ board when the camera looks down from +Y. */
export function isClockwiseFromPlusY(points: Array<{ x: number; z: number }>): boolean {
  return xzSignedArea(points) < 0;
}

export function eachStepClockwiseFromPlusY(points: Array<{ x: number; z: number }>): boolean {
  if (points.length < 3) return false;
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cz = points.reduce((sum, p) => sum + p.z, 0) / points.length;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const ax = a.x - cx;
    const az = a.z - cz;
    const bx = b.x - cx;
    const bz = b.z - cz;
    if (ax * bz - az * bx >= 0) return false;
  }
  return true;
}

export function cellsToXZ(cells: Array<{ col?: number; row?: number }>): Array<{ x: number; z: number }> {
  return cells.map((cell) => ({ x: cell.col!, z: cell.row! }));
}
