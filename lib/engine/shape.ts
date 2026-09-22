import type { BoardShape, Floor, ShapeKind } from '@/lib/engine/types';

export type { BoardShape, ShapeKind };

export const DEFAULT_SHAPE: Extract<BoardShape, { kind: 'square' }> = {
  kind: 'square',
  tilesPerSide: 8,
};

export const DEFAULT_CIRCLE_TILES = 12;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeShape(
  input: (Partial<BoardShape> & { kind?: ShapeKind }) | undefined,
): BoardShape {
  const kind = input?.kind ?? 'square';
  if (kind === 'square') {
    const tilesPerSide = clamp(
      'tilesPerSide' in (input ?? {}) ? Number((input as { tilesPerSide?: number }).tilesPerSide) : 8,
      3,
      12,
    );
    return { kind: 'square', tilesPerSide };
  }
  if (kind === 'rectangle') {
    let length = clamp(Number((input as { length?: number }).length ?? 8), 3, 12);
    let width = clamp(Number((input as { width?: number }).width ?? 6), 3, 12);
    if (length === width) {
      if (width > 3) width -= 1;
      else width += 1;
    }
    return { kind: 'rectangle', length, width };
  }
  if (kind === 'circle') {
    return {
      kind: 'circle',
      tiles: clamp(Number((input as { tiles?: number }).tiles ?? DEFAULT_CIRCLE_TILES), 3, 40),
    };
  }
  if (kind === 'hub-spoke') {
    return {
      kind: 'hub-spoke',
      hubTiles: clamp(Number((input as { hubTiles?: number }).hubTiles ?? 12), 3, 40),
      spokeCount: clamp(Number((input as { spokeCount?: number }).spokeCount ?? 4), 2, 12),
      spokeTiles: clamp(Number((input as { spokeTiles?: number }).spokeTiles ?? 6), 1, 12),
    };
  }
  return {
    kind: 'hub-spoke-wheel',
    hubTiles: clamp(Number((input as { hubTiles?: number }).hubTiles ?? 8), 3, 40),
    spokeCount: clamp(Number((input as { spokeCount?: number }).spokeCount ?? 4), 2, 12),
    spokeTiles: clamp(Number((input as { spokeTiles?: number }).spokeTiles ?? 4), 1, 12),
    wheelTiles: clamp(Number((input as { wheelTiles?: number }).wheelTiles ?? 16), 3, 40),
  };
}

export function shapeCellCount(shape: BoardShape): number {
  const n = normalizeShape(shape);
  if (n.kind === 'square') return 4 * n.tilesPerSide - 4;
  if (n.kind === 'rectangle') return 2 * n.length + 2 * n.width - 4;
  if (n.kind === 'circle') return n.tiles;
  if (n.kind === 'hub-spoke') return n.hubTiles + n.spokeCount * n.spokeTiles;
  return n.hubTiles + n.spokeCount * n.spokeTiles + n.wheelTiles;
}

export function inferShape(
  floor: Pick<Floor, 'shape' | 'columns' | 'rows' | 'cells'>,
): BoardShape {
  if (floor.shape) return normalizeShape(floor.shape);
  const n = floor.cells.length;
  if (n >= 4) {
    const side = Math.ceil((n + 4) / 4);
    if (4 * side - 4 === n) return normalizeShape({ kind: 'square', tilesPerSide: side });
  }
  return { ...DEFAULT_SHAPE };
}
