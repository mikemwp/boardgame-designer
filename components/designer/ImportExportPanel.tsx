'use client';

import { useRef, useState } from 'react';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { Button } from '@/components/ui/button';
import type { Card } from '@/lib/engine/types';

export function ImportExportPanel({
  onImportCards,
  onExportJson,
  onExportZip,
  onImportGame,
}: {
  onImportCards: (cards: Card[]) => void;
  onExportJson: () => void;
  onExportZip: () => void;
  onImportGame: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cardsOpen, setCardsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="imports-panel">
      <p className="text-sm font-medium text-slate-100">Imports</p>
      <p className="text-sm text-slate-400">
        CSV cards join this draft. Export / import a single game as JSON or zip. Import replaces the local
        draft with the same id and does not publish.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setCardsOpen(true)}>
          Import cards
        </Button>
        <Button type="button" variant="outline" onClick={onExportJson}>
          Export JSON
        </Button>
        <Button type="button" variant="outline" onClick={onExportZip}>
          Export zip
        </Button>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Import game
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.zip,application/json,application/zip"
        aria-label="Import game file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImportGame(file);
          event.target.value = '';
        }}
      />
      <ImportCardsDialog open={cardsOpen} onOpenChange={setCardsOpen} onImport={onImportCards} />
    </div>
  );
}
