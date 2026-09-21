'use client';

import { Button } from '@/components/ui/button';

export function LibraryBar({
  activeName,
  savedAt,
  canSave,
  onNew,
  onSave,
  onOpen,
}: {
  activeName: string;
  savedAt?: string;
  canSave: boolean;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-slate-800 p-3 md:flex-row md:items-center md:justify-between"
      data-testid="library-bar"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{activeName}</p>
        {savedAt ? (
          <p className="text-xs text-slate-400" data-testid="library-saved-at">
            Saved {savedAt}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onNew}>
          New
        </Button>
        <Button type="button" onClick={onSave} disabled={!canSave}>
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onOpen}>
          Open
        </Button>
      </div>
    </div>
  );
}
