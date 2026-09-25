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

const fieldClass = 'flex min-w-[5.5rem] flex-col gap-1';
const selectClass = 'h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm';

export function BoardShapeFields({
  shape,
  onChange,
  disabled = false,
  maxSquare = 12,
  maxRect,
  scope = 'level',
  align = 'center',
}: {
  shape: BoardShape;
  onChange: (shape: BoardShape) => void;
  disabled?: boolean;
  maxSquare?: number;
  maxRect?: { length: number; width: number };
  scope?: 'level' | 'room';
  align?: 'center' | 'end';
}) {
  const normalized = normalizeShape(shape);
  const squareSizes = Array.from({ length: Math.max(1, maxSquare - 2) }, (_, i) => i + 3);
  const lengthSizes = Array.from(
    { length: Math.max(1, (maxRect?.length ?? 12) - 2) },
    (_, i) => i + 3,
  );
  const widthSizes = Array.from(
    { length: Math.max(1, (maxRect?.width ?? 12) - 2) },
    (_, i) => i + 3,
  );

  const room = scope === 'room';
  const shapeLabel = room ? 'Room shape' : 'Shape';
  const tilesLabel = room ? 'Room tiles' : 'Tiles';
  const lengthLabel = room ? 'Room length' : 'Length';
  const widthLabel = room ? 'Room width' : 'Width';

  return (
    <div
      className={`flex shrink-0 flex-nowrap items-end gap-x-3 ${align === 'end' ? 'justify-end' : 'justify-center'}`}
      data-testid={room ? 'room-shape-fields' : 'board-shape-fields'}
    >
      <div className="flex min-w-[8rem] flex-col gap-1">
        <Label>{shapeLabel}</Label>
        <select
          aria-label={shapeLabel}
          className={selectClass}
          disabled={disabled}
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
          <Label>{tilesLabel}</Label>
          <select
            aria-label={tilesLabel}
            className={selectClass}
            disabled={disabled}
            value={normalized.tilesPerSide}
            onChange={(e) =>
              onChange(normalizeShape({ ...normalized, tilesPerSide: Number(e.target.value) }))
            }
          >
            {squareSizes.map((n) => (
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
            <Label>{lengthLabel}</Label>
            <select
              aria-label={lengthLabel}
              className={selectClass}
              disabled={disabled}
              value={normalized.length}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, length: Number(e.target.value) }))
              }
            >
              {lengthSizes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldClass}>
            <Label>{widthLabel}</Label>
            <select
              aria-label={widthLabel}
              className={selectClass}
              disabled={disabled}
              value={normalized.width}
              onChange={(e) =>
                onChange(normalizeShape({ ...normalized, width: Number(e.target.value) }))
              }
            >
              {widthSizes.map((n) => (
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
            disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
