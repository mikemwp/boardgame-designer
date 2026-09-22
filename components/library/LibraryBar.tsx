'use client';

import { Button } from '@/components/ui/button';

export type StudioMode = 'design' | 'test';

const hoverClass =
  'hover:bg-slate-600 hover:text-white dark:hover:bg-slate-600 enabled:hover:bg-slate-600';

export function LibraryBar({
  activeName,
  canSave,
  canTest,
  mode,
  onNew,
  onSave,
  onOpen,
  onDesign,
  onTest,
  onDelete,
  canDelete,
  canPublish = false,
  onPublish = () => {},
  published = false,
}: {
  activeName: string;
  canSave: boolean;
  canTest: boolean;
  mode: StudioMode;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onDesign: () => void;
  onTest: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  published?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-3"
      data-testid="library-bar"
    >
      <p
        className="min-w-0 flex-1 truncate text-center text-xl font-semibold text-slate-50"
        data-testid="library-game-title"
      >
        {activeName}
      </p>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className={hoverClass} onClick={onNew}>
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          className={hoverClass}
          onClick={onSave}
          disabled={!canSave}
        >
          Save
        </Button>
        <Button type="button" variant="outline" className={hoverClass} onClick={onOpen}>
          Open
        </Button>
        <Button
          type="button"
          variant="outline"
          className={hoverClass}
          onClick={onDelete}
          disabled={!canDelete}
          title={published ? 'Published games cannot be deleted' : undefined}
        >
          Delete
        </Button>
        <Button
          type="button"
          variant={mode === 'design' ? 'secondary' : 'outline'}
          className={hoverClass}
          aria-pressed={mode === 'design'}
          onClick={onDesign}
        >
          Design
        </Button>
        <Button
          type="button"
          variant={mode === 'test' ? 'secondary' : 'outline'}
          className={hoverClass}
          aria-pressed={mode === 'test'}
          disabled={!canTest}
          onClick={onTest}
        >
          Test
        </Button>
        <Button
          type="button"
          variant="outline"
          className={hoverClass}
          disabled={!canPublish}
          onClick={onPublish}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}
