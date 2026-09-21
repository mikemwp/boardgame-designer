'use client';

import { useCallback, useState } from 'react';
import { GameHud } from '@/components/hud/GameHud';
import { LibraryBar } from '@/components/library/LibraryBar';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { useLibrary, type UseLibraryOptions } from '@/hooks/use-library';
import type { GameState } from '@/lib/engine/game';
import {
  captureBootstrap,
  fromStoredBootstrap,
} from '@/lib/library/bootstrap';
import type { NewGameSource } from '@/lib/library/types';

export function StudioShell(options: UseLibraryOptions = {}) {
  const { active, activeId, drafts, ready, newGame, openGame, saveActive } =
    useLibrary(options);
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);

  const persistActive = useCallback(() => {
    if (!active || !snapshot) return;
    saveActive(captureBootstrap(snapshot, active.bootstrap.players));
  }, [active, snapshot, saveActive]);

  const onCreate = (input: { name: string; source: NewGameSource }) => {
    persistActive();
    newGame(input);
    setSnapshot(null);
    setNewOpen(false);
  };

  const onOpenDraft = (id: string) => {
    persistActive();
    openGame(id);
    setSnapshot(null);
    setOpenOpen(false);
  };

  if (!ready) {
    return <p className="text-slate-400">Loading library…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <LibraryBar
        activeName={active?.name ?? 'No game'}
        savedAt={active?.updatedAt}
        canSave={Boolean(active)}
        onNew={() => setNewOpen(true)}
        onSave={persistActive}
        onOpen={() => setOpenOpen(true)}
      />
      {active ? (
        <GameHud
          key={active.id}
          bootstrap={fromStoredBootstrap(active.bootstrap)}
          onStateChange={setSnapshot}
        />
      ) : (
        <p className="text-slate-400">Create a game to start playing.</p>
      )}
      <NewGameDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={onCreate}
      />
      <OpenGameDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        drafts={drafts}
        activeId={activeId}
        onOpen={onOpenDraft}
      />
    </div>
  );
}
