'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NewGameSource } from '@/lib/library/types';

export function NewGameDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; source: NewGameSource }) => void;
}) {
  const [name, setName] = useState('Climb');
  const [source, setSource] = useState<NewGameSource>('climb');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, source });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New game</DialogTitle>
          <DialogDescription>
            Create a named draft on this device. Existing drafts are not overwritten.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="game-name">Game name</Label>
          <Input
            id="game-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Game name"
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">Start from</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="climb"
                checked={source === 'climb'}
                onChange={() => setSource('climb')}
                aria-label="Climb sample"
              />
              Climb sample
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="empty"
                checked={source === 'empty'}
                onChange={() => setSource('empty')}
                aria-label="Empty board"
              />
              Empty board
            </label>
          </fieldset>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
