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

export function tokenPosToWorld(
  board: {
    floors: Array<{ id: string; index: number; cells: Array<{ id: string; index: number }> }>;
  },
  token: { floorId: string; cellId: string },
): Vec3 {
  const floor = board.floors.find((f) => f.id === token.floorId);
  const cell = floor?.cells.find((c) => c.id === token.cellId);
  if (!floor || !cell) return { x: 0, y: 0, z: 0 };
  return cellToWorld(floor.index, cell.index);
}
