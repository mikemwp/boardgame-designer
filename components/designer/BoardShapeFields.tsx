'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeShape, type BoardShape, type ShapeKind } from '@/lib/engine/shape';

const SHAPE_OPTIONS: Array<{ value: ShapeKind; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'hub-spoke', label: 'Hub/spoke' },
  { value: 'hub-spoke-wheel', label: 'Hub/spoke/wheel' },
];

export function BoardShapeFields({
  shape,
  onChange,
}: {
  shape: BoardShape;
  onChange: (shape: BoardShape) => void;
}) {
  const normalized = normalizeShape(shape);

  const updateNumber = (field: string, value: string) => {
    onChange(normalizeShape({ ...normalized, [field]: Number(value) }));
  };

  const fieldClass = 'flex min-w-[5.5rem] flex-col gap-1';

  return (
    <div
      className="flex flex-row flex-wrap items-end gap-x-3 gap-y-2"
      data-testid="board-shape-fields"
    >
      <div className="flex min-w-[8rem] flex-col gap-1">
        <Label>Board shape</Label>
        <select
          aria-label="Board shape"
          className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
          value={normalized.kind}
          onChange={(e) => onChange(normalizeShape({ kind: e.target.value as ShapeKind }))}
        >
          {SHAPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {normalized.kind === 'square' && (
        <div className={fieldClass}>
          <Label>Tiles per side</Label>
          <Input
            type="number"
            min={3}
            max={12}
            className="h-8"
            value={normalized.tilesPerSide}
            onChange={(e) => updateNumber('tilesPerSide', e.target.value)}
          />
        </div>
      )}

      {normalized.kind === 'rectangle' && (
        <>
          <div className={fieldClass}>
            <Label>Length</Label>
            <Input
              type="number"
              min={3}
              max={12}
              className="h-8"
              value={normalized.length}
              onChange={(e) => updateNumber('length', e.target.value)}
            />
          </div>
          <div className={fieldClass}>
            <Label>Width</Label>
            <Input
              type="number"
              min={3}
              max={12}
              className="h-8"
              value={normalized.width}
              onChange={(e) => updateNumber('width', e.target.value)}
            />
          </div>
        </>
      )}

      {normalized.kind === 'circle' && (
        <div className={fieldClass}>
          <Label>Tiles</Label>
          <Input
            type="number"
            min={3}
            max={40}
            className="h-8"
            value={normalized.tiles}
            onChange={(e) => updateNumber('tiles', e.target.value)}
          />
        </div>
      )}

      {(normalized.kind === 'hub-spoke' || normalized.kind === 'hub-spoke-wheel') && (
        <>
          <div className={fieldClass}>
            <Label>Hub tiles</Label>
            <Input
              type="number"
              min={3}
              max={40}
              className="h-8"
              value={normalized.hubTiles}
              onChange={(e) => updateNumber('hubTiles', e.target.value)}
            />
          </div>
          <div className={fieldClass}>
            <Label>Spokes</Label>
            <Input
              type="number"
              min={2}
              max={12}
              className="h-8"
              value={normalized.spokeCount}
              onChange={(e) => updateNumber('spokeCount', e.target.value)}
            />
          </div>
          <div className={fieldClass}>
            <Label>Spoke tiles</Label>
            <Input
              type="number"
              min={1}
              max={12}
              className="h-8"
              value={normalized.spokeTiles}
              onChange={(e) => updateNumber('spokeTiles', e.target.value)}
            />
          </div>
        </>
      )}

      {normalized.kind === 'hub-spoke-wheel' && (
        <div className={fieldClass}>
          <Label>Wheel tiles</Label>
          <Input
            type="number"
            min={3}
            max={40}
            className="h-8"
            value={normalized.wheelTiles}
            onChange={(e) => updateNumber('wheelTiles', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
