'use client';

import { useEffect, useRef, useState } from 'react';
import { cellAt, DEFAULT_COLUMNS, DEFAULT_ROWS } from '@/lib/engine/layout';
import { inferShape } from '@/lib/engine/shape';
import { buildShapeLayout, DESIGNER_POLAR_PAD, shapeSlotBounds } from '@/lib/engine/shape-layout';
import { designerCellLabel } from '@/lib/designer/tile-chrome';
import type { Floor } from '@/lib/engine/types';

const GRID_GAP_PX = 4;
const MAX_TILE_PX = 48;
const MIN_TILE_PX = 16;

function computeTileSize(
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return MAX_TILE_PX;
  const byWidth = (containerWidth - GRID_GAP_PX * (columns - 1)) / columns;
  const byHeight = (containerHeight - GRID_GAP_PX * (rows - 1)) / rows;
  const fit = Math.min(byWidth, byHeight, MAX_TILE_PX);
  return Math.max(MIN_TILE_PX, Math.floor(fit));
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(MAX_TILE_PX);
  const shape = inferShape(floor);
  const isPolar = shape.kind === 'circle' || shape.kind === 'hub-spoke' || shape.kind === 'hub-spoke-wheel';
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;

  useEffect(() => {
    if (isPolar) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setTileSize(computeTileSize(width, height, columns, rows));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns, rows, isPolar]);

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
            else if (cell?.kind === 'room') fill = 'rgb(15 118 110)';
            else if (cell?.kind === 'door') fill = 'rgb(157 23 77)';
            else if (cell?.kind === 'board') fill = 'rgb(87 83 78)';
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

  const slots: Array<{ col: number; row: number }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      slots.push({ col, row });
    }
  }

  const gridWidth = tileSize * columns + GRID_GAP_PX * (columns - 1);
  const gridHeight = tileSize * rows + GRID_GAP_PX * (rows - 1);

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto overflow-x-hidden p-2"
      data-testid="layout-grid-container"
    >
      <div
        className="grid shrink-0 gap-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${tileSize}px)`,
          width: gridWidth,
          height: gridHeight,
        }}
        aria-label="Layout grid"
      >
        {slots.map(({ col, row }) => {
          const cell = cellAt(floor, col, row);
          const selected = cell?.id === selectedCellId;
          let className = 'rounded border text-[10px] md:text-xs';
          if (cell?.kind === 'hud') className += ' border-violet-400 bg-violet-900 text-violet-100';
          else if (cell?.kind === 'stair') className += ' border-amber-500 bg-amber-700 text-amber-50';
          else if (cell?.kind === 'room') className += ' border-teal-400 bg-teal-800 text-teal-50';
          else if (cell?.kind === 'door') className += ' border-pink-400 bg-pink-800 text-pink-50';
          else if (cell?.kind === 'board') className += ' border-stone-400 bg-stone-700 text-stone-100';
          else if (cell) className += ' border-slate-500 bg-slate-600 text-slate-50';
          else className += ' border-slate-800 bg-slate-950 text-slate-500';
          if (selected) className += ' ring-2 ring-sky-400';
          if (cell?.start) className += ' outline outline-1 outline-emerald-400 text-white';
          if (cell?.end) className += ' outline outline-1 outline-rose-400';
          const ariaLabel = cell ? cell.id : `Empty ${col},${row}`;
          return (
            <button
              key={`${col}-${row}`}
              type="button"
              data-testid={`slot-${col}-${row}`}
              className={className}
              style={{ width: tileSize, height: tileSize }}
              aria-label={ariaLabel}
              onPointerDown={() => {
                if (cell) dragId.current = cell.id;
              }}
              onPointerUp={() => {
                const from = dragId.current;
                dragId.current = null;
                if (from && !cell) {
                  onMoveCell(from, col, row);
                }
              }}
              onClick={() => onSlotActivate(col, row)}
            >
              {cell ? designerCellLabel(cell) : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
