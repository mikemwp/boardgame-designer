import { normalizeShape, type BoardShape } from '@/lib/engine/shape';
import type { Cell, CellRegion, HudRect } from '@/lib/engine/types';

export const GRID_PAD = 1;
export const RING_INNER_RADIUS = 1.6;
export const RING_OUTER_RADIUS = 2.6;
export const SPOKE_TILE = 1;
/** Extra viewBox padding so polar boards fit fully in the designer canvas. */
export const DESIGNER_POLAR_PAD = 1;

export interface Vec2 {
  x: number;
  z: number;
}

export interface TileSlot {
  id: string;
  region: CellRegion;
  slot: number;
  spokeIndex?: number;
  col?: number;
  row?: number;
  polygon: Vec2[];
  nextId?: string;
  prevId?: string;
  branchId?: string;
  end?: boolean;
}

export interface ShapeLayout {
  shape: BoardShape;
  columns: number;
  rows: number;
  hud: HudRect;
  slots: TileSlot[];
}

export interface ShapeSlotBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function shapeSlotBounds(shape: BoardShape, pad = 0): ShapeSlotBounds {
  const layout = buildShapeLayout(shape);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const slot of layout.slots) {
    for (const p of slot.polygon) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  }
  return {
    minX: minX - pad,
    maxX: maxX + pad,
    minZ: minZ - pad,
    maxZ: maxZ + pad,
  };
}

function boxPolygon(col: number, row: number): Vec2[] {
  const x = col;
  const z = row;
  return [
    { x: x - 0.5, z: z - 0.5 },
    { x: x + 0.5, z: z - 0.5 },
    { x: x + 0.5, z: z + 0.5 },
    { x: x - 0.5, z: z + 0.5 },
  ];
}

function walkRectRing(
  left: number,
  top: number,
  length: number,
  width: number,
): Array<{ col: number; row: number }> {
  const right = left + length - 1;
  const bottom = top + width - 1;
  const positions: Array<{ col: number; row: number }> = [];
  for (let col = left; col <= right; col += 1) positions.push({ col, row: top });
  for (let row = top + 1; row < bottom; row += 1) positions.push({ col: right, row });
  for (let col = right; col >= left; col -= 1) positions.push({ col, row: bottom });
  for (let row = bottom - 1; row > top; row -= 1) positions.push({ col: left, row });
  return positions;
}

function linkRing(slots: TileSlot[]): void {
  for (let i = 0; i < slots.length; i += 1) {
    const prev = slots[(i - 1 + slots.length) % slots.length]!;
    const next = slots[(i + 1) % slots.length]!;
    slots[i]!.prevId = prev.id;
    slots[i]!.nextId = next.id;
  }
}

function wedgeTrapezoid(index: number, count: number, innerR: number, outerR: number): Vec2[] {
  const a0 = (index / count) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((index + 1) / count) * Math.PI * 2 - Math.PI / 2;
  const inner0 = { x: Math.cos(a0) * innerR, z: Math.sin(a0) * innerR };
  const inner1 = { x: Math.cos(a1) * innerR, z: Math.sin(a1) * innerR };
  const outer1 = { x: Math.cos(a1) * outerR, z: Math.sin(a1) * outerR };
  const outer0 = { x: Math.cos(a0) * outerR, z: Math.sin(a0) * outerR };
  return [inner0, inner1, outer1, outer0];
}

function circleSlots(
  count: number,
  region: CellRegion,
  innerR: number,
  outerR: number,
  prefix: string,
): TileSlot[] {
  const slots: TileSlot[] = Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    region,
    slot: i,
    polygon: wedgeTrapezoid(i, count, innerR, outerR),
  }));
  linkRing(slots);
  return slots;
}

function attachmentIndexes(count: number, spokeCount: number): number[] {
  return Array.from({ length: spokeCount }, (_, i) => Math.round((i * count) / spokeCount) % count);
}

function spokePolygon(angle: number, indexFromHub: number, innerStart: number): Vec2[] {
  const r0 = innerStart + indexFromHub * SPOKE_TILE;
  const r1 = r0 + SPOKE_TILE;
  const half = 0.35;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const px = -sa;
  const pz = ca;
  const a = { x: ca * r0 + px * half, z: sa * r0 + pz * half };
  const b = { x: ca * r0 - px * half, z: sa * r0 - pz * half };
  const c = { x: ca * r1 - px * half, z: sa * r1 - pz * half };
  const d = { x: ca * r1 + px * half, z: sa * r1 + pz * half };
  return [a, b, c, d];
}

function hubSpokeSlots(
  shape: Extract<BoardShape, { kind: 'hub-spoke' | 'hub-spoke-wheel' }>,
): TileSlot[] {
  const hub = circleSlots(shape.hubTiles, 'hub', RING_INNER_RADIUS, RING_OUTER_RADIUS, 'hub');
  const attach = attachmentIndexes(shape.hubTiles, shape.spokeCount);
  const wheelInner = RING_OUTER_RADIUS + shape.spokeTiles * SPOKE_TILE;
  const wheel =
    shape.kind === 'hub-spoke-wheel'
      ? circleSlots(shape.wheelTiles, 'wheel', wheelInner, wheelInner + 1, 'wheel')
      : [];
  const wheelAttach =
    shape.kind === 'hub-spoke-wheel' ? attachmentIndexes(shape.wheelTiles, shape.spokeCount) : [];
  const spokes: TileSlot[] = [];
  for (let s = 0; s < shape.spokeCount; s += 1) {
    const hubIndex = attach[s]!;
    const hubSlot = hub[hubIndex]!;
    const angle = ((hubIndex + 0.5) / shape.hubTiles) * Math.PI * 2 - Math.PI / 2;
    for (let k = 0; k < shape.spokeTiles; k += 1) {
      const id = `spoke-${s}-${k}`;
      spokes.push({
        id,
        region: 'spoke',
        slot: k,
        spokeIndex: s,
        polygon: spokePolygon(angle, k, RING_OUTER_RADIUS),
        end: shape.kind === 'hub-spoke' && k === shape.spokeTiles - 1,
      });
    }
    const first = spokes[spokes.length - shape.spokeTiles]!;
    hubSlot.branchId = first.id;
    first.prevId = hubSlot.id;
    for (let k = 0; k < shape.spokeTiles; k += 1) {
      const cell = spokes[spokes.length - shape.spokeTiles + k]!;
      if (k > 0) cell.prevId = `spoke-${s}-${k - 1}`;
      if (k < shape.spokeTiles - 1) cell.nextId = `spoke-${s}-${k + 1}`;
    }
    if (shape.kind === 'hub-spoke-wheel') {
      const last = spokes[spokes.length - 1]!;
      const w = wheel[wheelAttach[s]!]!;
      last.nextId = w.id;
      w.branchId = last.id;
    }
  }
  return [...hub, ...spokes, ...wheel];
}

function cartesianLayout(length: number, width: number, region: CellRegion): ShapeLayout {
  const columns = length + GRID_PAD * 2;
  const rows = width + GRID_PAD * 2;
  const positions = walkRectRing(GRID_PAD, GRID_PAD, length, width);
  const slots: TileSlot[] = positions.map((pos, i) => ({
    id: `ring-${i}`,
    region,
    slot: i,
    col: pos.col,
    row: pos.row,
    polygon: boxPolygon(pos.col, pos.row),
  }));
  linkRing(slots);
  return {
    shape:
      length === width
        ? { kind: 'square', tilesPerSide: length }
        : { kind: 'rectangle', length, width },
    columns,
    rows,
    hud: {
      col: GRID_PAD + 1,
      row: GRID_PAD + 1,
      width: Math.max(0, length - 2),
      height: Math.max(0, width - 2),
    },
    slots,
  };
}

export function buildShapeLayout(input: BoardShape): ShapeLayout {
  const shape = normalizeShape(input);
  if (shape.kind === 'square') {
    return { ...cartesianLayout(shape.tilesPerSide, shape.tilesPerSide, 'ring'), shape };
  }
  if (shape.kind === 'rectangle') {
    return { ...cartesianLayout(shape.length, shape.width, 'ring'), shape };
  }
  if (shape.kind === 'circle') {
    return {
      shape,
      columns: 0,
      rows: 0,
      hud: { col: 0, row: 0, width: 0, height: 0 },
      slots: circleSlots(shape.tiles, 'ring', RING_INNER_RADIUS, RING_OUTER_RADIUS, 'ring'),
    };
  }
  return {
    shape,
    columns: 0,
    rows: 0,
    hud: { col: 0, row: 0, width: 0, height: 0 },
    slots: hubSpokeSlots(shape),
  };
}

export function isHudSlotInLayout(layout: ShapeLayout, col: number, row: number): boolean {
  const hud = layout.hud;
  if (hud.width <= 0 || hud.height <= 0) return false;
  return col >= hud.col && col < hud.col + hud.width && row >= hud.row && row < hud.row + hud.height;
}

export function cellSlotKey(cell: Pick<Cell, 'region' | 'spokeIndex' | 'slot' | 'index'>): string {
  return `${cell.region ?? 'ring'}:${cell.spokeIndex ?? ''}:${cell.slot ?? cell.index}`;
}

export function layoutNeighbors(
  floor: { cells: Cell[]; shape?: BoardShape },
): Map<string, { nextId?: string; prevId?: string; branchId?: string; end?: boolean }> {
  const layout = buildShapeLayout(floor.shape ?? { kind: 'square', tilesPerSide: 8 });
  const byKey = new Map<string, string>();
  for (const cell of floor.cells) {
    byKey.set(cellSlotKey(cell), cell.id);
  }
  const result = new Map<string, { nextId?: string; prevId?: string; branchId?: string; end?: boolean }>();
  for (const slot of layout.slots) {
    const id = byKey.get(`${slot.region}:${slot.spokeIndex ?? ''}:${slot.slot}`);
    if (!id) continue;
    const resolve = (slotId?: string) => {
      if (!slotId) return undefined;
      const s = layout.slots.find((x) => x.id === slotId);
      if (!s) return undefined;
      return byKey.get(`${s.region}:${s.spokeIndex ?? ''}:${s.slot}`);
    };
    result.set(id, {
      nextId: resolve(slot.nextId),
      prevId: resolve(slot.prevId),
      branchId: resolve(slot.branchId),
      end: slot.end,
    });
  }
  return result;
}

export function isRegionLoop(
  neighbors: Map<string, { nextId?: string; prevId?: string; branchId?: string }>,
  idsInRegion: string[],
): boolean {
  if (idsInRegion.length < 2) return idsInRegion.length === 0;
  const idSet = new Set(idsInRegion);
  const start = idsInRegion[0]!;
  let current = start;
  let prev: string | undefined;
  const visited = new Set<string>();
  for (let i = 0; i < idsInRegion.length; i += 1) {
    if (visited.has(current)) return false;
    visited.add(current);
    const links = neighbors.get(current);
    if (!links?.nextId) return false;
    prev = current;
    current = links.nextId;
    if (!idSet.has(current)) return false;
  }
  return current === start && visited.size === idsInRegion.length;
}

export function isSpokePath(
  neighbors: Map<string, { nextId?: string; prevId?: string; end?: boolean }>,
  cellsOfOneSpoke: Cell[],
  requiresWheel: boolean,
): boolean {
  const sorted = [...cellsOfOneSpoke].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  for (let i = 0; i < sorted.length; i += 1) {
    const cell = sorted[i]!;
    if ((cell.slot ?? i) !== i) return false;
    const links = neighbors.get(cell.id);
    if (!links) return false;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (links.prevId !== prev.id) return false;
    }
    if (i < sorted.length - 1) {
      const next = sorted[i + 1]!;
      if (links.nextId !== next.id) return false;
    }
  }
  const last = sorted[sorted.length - 1]!;
  const lastLinks = neighbors.get(last.id);
  if (!lastLinks) return false;
  if (requiresWheel) {
    return Boolean(lastLinks.nextId);
  }
  return lastLinks.end === true && !lastLinks.nextId;
}
