'use client';

import { useRef } from 'react';
import { cellAt, DEFAULT_COLUMNS, DEFAULT_ROWS, isHudSlot } from '@/lib/engine/layout';
import type { Floor } from '@/lib/engine/types';

export function LayoutGrid({
  floor,
  selectedCellId,
  onSlotActivate,
  onMoveCell,
}: {
  floor: Floor;
  selectedCellId?: string;
  onSlotActivate: (col: number, row: number) => void;
  onMoveCell: (cellId: string, col: number, row: number) => void;
}) {
  const dragId = useRef<string | null>(null);
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
      className="grid w-full gap-1 overflow-x-auto"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(2.25rem, 1fr))` }}
      aria-label="Layout grid"
    >
      {slots.map(({ col, row }) => {
        const hud = isHudSlot(floor, col, row);
        const cell = cellAt(floor, col, row);
        const selected = cell?.id === selectedCellId;
        let className = 'h-10 rounded border text-[10px] md:text-xs';
        if (hud) className += ' border-slate-700 bg-slate-800 text-slate-500';
        else if (cell?.kind === 'stair') className += ' border-amber-500 bg-amber-700 text-amber-50';
        else if (cell) className += ' border-slate-500 bg-slate-600 text-slate-50';
        else className += ' border-slate-800 bg-slate-950 text-slate-500';
        if (selected) className += ' ring-2 ring-sky-400';
        if (cell?.start) className += ' outline outline-1 outline-emerald-400';
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
            {hud ? 'HUD' : cell?.kind === 'stair' ? 'Stair' : cell ? String(cell.index) : ''}
          </button>
        );
      })}
    </div>
  );
}
