'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GameDocument, NewGameInput } from '@/lib/library/types';
import { documentStatus } from '@/lib/library/version';

export function NewGameDialog({
  open,
  onOpenChange,
  onCreate,
  games = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewGameInput) => void;
  games?: GameDocument[];
}) {
  const [name, setName] = useState('');
  const [sourceKey, setSourceKey] = useState('empty');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSourceKey('empty');
    const frame = window.requestAnimationFrame(() => nameRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const source: NewGameInput['source'] =
      sourceKey === 'empty'
        ? 'empty'
        : sourceKey === 'climb'
          ? 'climb'
          : { copyFrom: sourceKey.slice('copy:'.length) };
    onCreate({ name: trimmed, source });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="game-name">Game name</Label>
          <Input
            id="game-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Game name"
            autoFocus
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">Start from</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="empty"
                checked={sourceKey === 'empty'}
                onChange={() => setSourceKey('empty')}
                aria-label="Empty board"
              />
              Empty board
            </label>
            {games.map((game) => {
              const status = documentStatus(game);
              const suffix = status === 'published' ? '(Published)' : '(draft)';
              const key = `copy:${game.id}`;
              return (
                <label key={game.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="new-game-source"
                    value={key}
                    checked={sourceKey === key}
                    onChange={() => setSourceKey(key)}
                    aria-label={`${game.name} ${suffix}`}
                  />
                  {game.name} {suffix}
                </label>
              );
            })}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="climb"
                checked={sourceKey === 'climb'}
                onChange={() => setSourceKey('climb')}
                aria-label="Climb sample"
              />
              Climb sample
            </label>
          </fieldset>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={submit}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
