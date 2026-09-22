'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function UnsavedChangesDialog({
  open,
  gameName,
  onOpenChange,
  onSave,
  onDiscard,
}: {
  open: boolean;
  gameName: string;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save changes first?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-300">
          {gameName} has unsaved changes. Save before opening another game?
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard}>
            Don&apos;t save
          </Button>
          <Button type="button" onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
