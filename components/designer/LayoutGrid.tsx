'use client';

import { useRef } from 'react';
import { cellAt, DEFAULT_COLUMNS, DEFAULT_ROWS, isHudSlot } from '@/lib/engine/layout';
import { inferShape } from '@/lib/engine/shape';
import { buildShapeLayout, DESIGNER_POLAR_PAD, shapeSlotBounds } from '@/lib/engine/shape-layout';
import type { Floor } from '@/lib/engine/types';

function cellInSlot(
  floor: Floor,
  slot: { region: string; spokeIndex?: number; slot: number },
) {
  return floor.cells.find(
    (c) =>
      c.region === slot.region &&
      (c.spokeIndex ?? -1) === (slot.spokeIndex ?? -1) &&
      c.slot === slot.slot,
  );
}

function polarPathD(polygon: Array<{ x: number; z: number }>): string {
  if (polygon.length === 0) return '';
  const first = polygon[0]!;
  const rest = polygon.slice(1).map((p) => `L ${p.x} ${p.z}`).join(' ');
  return `M ${first.x} ${first.z} ${rest} Z`;
}

export function LayoutGrid({
  floor,
  selectedCellId,
  onSlotActivate,
  onMoveCell,
  onSlotActivateId,
  onMoveCellToSlot,
}: {
  floor: Floor;
  selectedCellId?: string;
  onSlotActivate: (col: number, row: number) => void;
  onMoveCell: (cellId: string, col: number, row: number) => void;
  onSlotActivateId?: (slotId: string) => void;
  onMoveCellToSlot?: (cellId: string, slotId: string) => void;
}) {
  const dragId = useRef<string | null>(null);
  const shape = inferShape(floor);
  const isPolar = shape.kind === 'circle' || shape.kind === 'hub-spoke' || shape.kind === 'hub-spoke-wheel';

  if (isPolar) {
    const layout = buildShapeLayout(shape);
    const bounds = shapeSlotBounds(shape, DESIGNER_POLAR_PAD);
    const viewWidth = bounds.maxX - bounds.minX;
    const viewHeight = bounds.maxZ - bounds.minZ;
    const viewBox = `${bounds.minX} ${bounds.minZ} ${viewWidth} ${viewHeight}`;

    return (
      <div
        className="flex min-h-0 w-full max-h-full items-center justify-center overflow-hidden p-2"
        aria-label="Layout grid"
      >
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="max-h-full max-w-full min-h-0 min-w-0"
          style={{ aspectRatio: `${viewWidth} / ${viewHeight}`, width: 'min(100%, 28rem)', height: 'auto' }}
        >
          <circle
            cx={0}
            cy={0}
            r={1.5}
            fill="rgb(30 41 59)"
            stroke="rgb(51 65 85)"
            aria-label="HUD — drops blocked"
          />
          {layout.slots.map((slot) => {
            const cell = cellInSlot(floor, slot);
            const selected = cell?.id === selectedCellId;
            let fill = 'rgb(2 6 23)';
            if (cell?.kind === 'stair') fill = 'rgb(180 83 9)';
            else if (cell) fill = 'rgb(71 85 105)';
            return (
              <path
                key={slot.id}
                data-testid={`slot-${slot.id}`}
                d={polarPathD(slot.polygon)}
                fill={fill}
                stroke={
                  selected
                    ? 'rgb(56 189 248)'
                    : cell?.start
                      ? 'rgb(52 211 153)'
                      : cell?.end
                        ? 'rgb(244 63 94)'
                        : 'rgb(30 41 59)'
                }
                strokeWidth={selected ? 0.08 : cell?.start || cell?.end ? 0.06 : 0.04}
                aria-label={cell ? cell.id : `Empty ${slot.id}`}
                onPointerDown={() => {
                  if (cell) dragId.current = cell.id;
                }}
                onPointerUp={() => {
                  const from = dragId.current;
                  dragId.current = null;
                  if (from && !cell && onMoveCellToSlot) {
                    onMoveCellToSlot(from, slot.id);
                  }
                }}
                onClick={() => {
                  if (onSlotActivateId) onSlotActivateId(slot.id);
                }}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  const slots: Array<{ col: number; row: number }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      slots.push({ col, row });
    }
  }

  return (
    <div
      className="grid min-w-0 w-full max-w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label="Layout grid"
    >
      {slots.map(({ col, row }) => {
        const hud = isHudSlot(floor, col, row);
        const cell = cellAt(floor, col, row);
        const selected = cell?.id === selectedCellId;
        let className = 'aspect-square w-full rounded border text-[10px] md:text-xs';
        if (hud) className += ' border-slate-700 bg-slate-800 text-slate-500';
        else if (cell?.kind === 'stair') className += ' border-amber-500 bg-amber-700 text-amber-50';
        else if (cell) className += ' border-slate-500 bg-slate-600 text-slate-50';
        else className += ' border-slate-800 bg-slate-950 text-slate-500';
        if (selected) className += ' ring-2 ring-sky-400';
        if (cell?.start) className += ' outline outline-1 outline-emerald-400';
        if (cell?.end) className += ' outline outline-1 outline-rose-400';
        return (
          <button
            key={`${col}-${row}`}
            type="button"
            data-testid={`slot-${col}-${row}`}
            className={className}
            aria-label={hud ? 'HUD — drops blocked' : cell ? cell.id : `Empty ${col},${row}`}
            onPointerDown={() => {
              if (cell) dragId.current = cell.id;
            }}
            onPointerUp={() => {
              const from = dragId.current;
              dragId.current = null;
              if (from && !hud && !cell) {
                onMoveCell(from, col, row);
                return;
              }
            }}
            onClick={() => {
              if (hud) return;
              onSlotActivate(col, row);
            }}
          >
            {hud ? 'HUD' : cell?.kind === 'stair' ? 'Stair' : ''}
          </button>
        );
      })}
    </div>
  );
}
