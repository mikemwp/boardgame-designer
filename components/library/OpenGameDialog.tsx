'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GameDocument } from '@/lib/library/types';

export function OpenGameDialog({
  open,
  onOpenChange,
  drafts,
  activeId,
  onOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: GameDocument[];
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open game</DialogTitle>
          <DialogDescription>
            Drafts on this device. Publishing is not in this slice.
          </DialogDescription>
        </DialogHeader>
        {drafts.length === 0 ? (
          <p className="text-sm text-slate-400">No drafts on this device.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Button
                  type="button"
                  variant={draft.id === activeId ? 'secondary' : 'outline'}
                  className="h-auto w-full justify-between py-2"
                  aria-current={draft.id === activeId ? 'true' : undefined}
                  aria-label={`Open ${draft.name}`}
                  onClick={() => onOpen(draft.id)}
                >
                  <span>{draft.name}</span>
                  <span className="text-xs text-slate-400">{draft.updatedAt}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
