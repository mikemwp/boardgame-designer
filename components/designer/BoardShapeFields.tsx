'use client';

import { Label } from '@/components/ui/label';
import { normalizeShape, type BoardShape, type ShapeKind } from '@/lib/engine/shape';

const ALL_SHAPE_OPTIONS: Array<{ value: ShapeKind; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'hub-spoke', label: 'Hub/spoke' },
  { value: 'hub-spoke-wheel', label: 'Hub/spoke/wheel' },
];

const VISIBLE_SHAPE_OPTIONS = ALL_SHAPE_OPTIONS.filter(
  (opt) => opt.value === 'square' || opt.value === 'rectangle',
);

const SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 3);

const fieldClass = 'flex min-w-[5.5rem] flex-col gap-1';
const selectClass = 'h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm';

export function BoardShapeFields({
  shape,
  onChange,
}: {
  shape: BoardShape;
  onChange: (shape: BoardShape) => void;
}) {
  const normalized = normalizeShape(shape);

  return (
    <div
      className="flex shrink-0 flex-nowrap items-end justify-center gap-x-3"
      data-testid="board-shape-fields"
    >
      <div className="flex min-w-[8rem] flex-col gap-1">
        <Label>Board shape</Label>
        <select
          aria-label="Board shape"
          className={selectClass}
          value={normalized.kind}
          onChange={(e) => onChange(normalizeShape({ kind: e.target.value as ShapeKind }))}
        >
          {VISIBLE_SHAPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {normalized.kind === 'square' && (
        <div className={fieldClass}>
          <Label>Tiles</Label>
          <select
            aria-label="Tiles"
            className={selectClass}
            value={normalized.tilesPerSide}
            onChange={(e) =>
              onChange(normalizeShape({ ...normalized, tilesPerSide: Number(e.target.value) }))
            }
          >
            {SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}×{n}
              </option>
            ))}
          </select>
        </div>
      )}

      {normalized.kind === 'rectangle' && (
        <>
          <div className={fieldClass}>
            <Label>Length</Label>
            <select
              aria-label="Length"
              className={selectClass}
              value={normalized.length}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, length: Number(e.target.value) }))
              }
            >
              {SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldClass}>
            <Label>Width</Label>
            <select
              aria-label="Width"
              className={selectClass}
              value={normalized.width}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, width: Number(e.target.value) }))
              }
            >
              {SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {normalized.kind === 'circle' && (
        <div className={fieldClass}>
          <Label>Tiles</Label>
          <select
            aria-label="Tiles"
            className={selectClass}
            value={normalized.tiles}
            onChange={(e) =>
              onChange(normalizeShape({ ...normalized, tiles: Number(e.target.value) }))
            }
          >
            {Array.from({ length: 38 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {(normalized.kind === 'hub-spoke' || normalized.kind === 'hub-spoke-wheel') && (
        <>
          <div className={fieldClass}>
            <Label>Hub tiles</Label>
            <select
              aria-label="Hub tiles"
              className={selectClass}
              value={normalized.hubTiles}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, hubTiles: Number(e.target.value) }))
              }
            >
              {Array.from({ length: 38 }, (_, i) => i + 3).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldClass}>
            <Label>Spokes</Label>
            <select
              aria-label="Spokes"
              className={selectClass}
              value={normalized.spokeCount}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, spokeCount: Number(e.target.value) }))
              }
            >
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldClass}>
            <Label>Spoke tiles</Label>
            <select
              aria-label="Spoke tiles"
              className={selectClass}
              value={normalized.spokeTiles}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, spokeTiles: Number(e.target.value) }))
              }
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {normalized.kind === 'hub-spoke-wheel' && (
        <div className={fieldClass}>
          <Label>Wheel tiles</Label>
          <select
            aria-label="Wheel tiles"
            className={selectClass}
            value={normalized.wheelTiles}
            onChange={(e) =>
              onChange(normalizeShape({ ...normalized, wheelTiles: Number(e.target.value) }))
            }
          >
            {Array.from({ length: 38 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
