'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { percentTotal, percentsValid } from '@/lib/designer/spinners';
import type { SpinnerDef } from '@/lib/engine/types';

export function SpinnerEditor({
  spinners,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onSplit,
  onLinked,
  onAddSegment,
  onRemoveSegment,
  onSegmentLabel,
  onSegmentPercent,
}: {
  spinners: SpinnerDef[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSplit: (split: SpinnerDef['split']) => void;
  onLinked: (linked: boolean) => void;
  onAddSegment: () => void;
  onRemoveSegment: (segmentId: string) => void;
  onSegmentLabel: (segmentId: string, label: string) => void;
  onSegmentPercent: (segmentId: string, percent: number) => void;
}) {
  const selected = spinners.find((spinner) => spinner.id === selectedId);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="spinner-editor">
      <p className="text-sm font-medium text-slate-100">Spinners</p>
      <Button type="button" variant="outline" onClick={onCreate}>
        New spinner
      </Button>
      {spinners.length === 0 ? (
        <p className="text-sm text-slate-400">
          No spinners yet. Create one, then attach it to a tile or card.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {spinners.map((spinner) => (
            <li key={spinner.id}>
              <button
                type="button"
                aria-label={`Select spinner ${spinner.name}`}
                aria-pressed={selectedId === spinner.id}
                className={`w-full rounded-md px-2 py-1 text-left text-sm ${
                  selectedId === spinner.id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                }`}
                onClick={() => onSelect(spinner.id)}
              >
                {spinner.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <>
          <Label htmlFor="spinner-name">Name</Label>
          <Input
            id="spinner-name"
            aria-label="Spinner name"
            value={selected.name}
            onChange={(e) => onRename(e.target.value)}
          />
          <Label htmlFor="spinner-split">Segments</Label>
          <select
            id="spinner-split"
            aria-label="Segment split"
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
            value={selected.split}
            onChange={(e) => onSplit(e.target.value as SpinnerDef['split'])}
          >
            <option value="equal">Equal</option>
            <option value="percent">Percent</option>
          </select>
          {selected.split === 'percent' ? (
            <p className={`text-xs ${percentsValid(selected) ? 'text-slate-400' : 'text-amber-400'}`}>
              {percentTotal(selected.segments)}% of 100%
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {selected.segments.map((segment) => (
              <li key={segment.id} className="flex flex-col gap-1">
                <Input
                  aria-label={`Segment name ${segment.id}`}
                  value={segment.label}
                  onChange={(e) => onSegmentLabel(segment.id, e.target.value)}
                />
                {selected.split === 'percent' ? (
                  <Input
                    type="number"
                    aria-label={`Segment percent ${segment.id}`}
                    value={segment.percent ?? ''}
                    onChange={(e) => onSegmentPercent(segment.id, Number(e.target.value))}
                  />
                ) : null}
                <Button type="button" variant="outline" onClick={() => onRemoveSegment(segment.id)}>
                  Remove segment
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" onClick={onAddSegment}>
            Add segment
          </Button>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              aria-label="Linked to a function"
              checked={Boolean(selected.linked)}
              onChange={(e) => onLinked(e.target.checked)}
            />
            Linked to a function
          </label>
          <p className="text-xs text-slate-400">
            Function outcomes (who acts, which way to walk) are saved as labels for now.
          </p>
          <Button type="button" variant="outline" onClick={onDelete}>
            Delete spinner
          </Button>
        </>
      ) : null}
    </div>
  );
}
