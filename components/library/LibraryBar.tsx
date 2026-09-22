'use client';

import { Button } from '@/components/ui/button';

export type StudioMode = 'design' | 'test';

export function LibraryBar({
  activeName,
  savedAt,
  canSave,
  mode,
  onNew,
  onSave,
  onOpen,
  onDesign,
  onTest,
  onDelete,
  canDelete,
  published = false,
}: {
  activeName: string;
  savedAt?: string;
  canSave: boolean;
  mode: StudioMode;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onDesign: () => void;
  onTest: () => void;
  onDelete: () => void;
  canDelete: boolean;
  published?: boolean;
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
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          disabled={!canDelete}
          title={published ? 'Published games cannot be deleted' : undefined}
        >
          Delete
        </Button>
        <Button
          type="button"
          variant={mode === 'design' ? 'secondary' : 'outline'}
          aria-pressed={mode === 'design'}
          onClick={onDesign}
        >
          Design
        </Button>
        <Button
          type="button"
          variant={mode === 'test' ? 'secondary' : 'outline'}
          aria-pressed={mode === 'test'}
          onClick={onTest}
        >
          Test
        </Button>
      </div>
    </div>
  );
}
