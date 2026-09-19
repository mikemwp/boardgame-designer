'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseCardCsv } from '@/lib/import/spreadsheet';
import type { Card } from '@/lib/engine/types';

export function ImportCardsDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (cards: Card[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { cards, errors: parseErrors } = parseCardCsv(text);
    setErrors(parseErrors);
    if (cards.length > 0) {
      onImport(cards);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import cards</DialogTitle>
          <DialogDescription>
            Upload a CSV with header row. Required columns: pack, title.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm">
            <span>Upload CSV file</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="Upload CSV"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
          {errors.length > 0 && (
            <ul className="text-sm text-destructive">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
