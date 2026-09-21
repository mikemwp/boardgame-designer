'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import type { DesignerTool } from '@/components/designer/DesignerPalette';
import { GameHud } from '@/components/hud/GameHud';
import { LibraryBar, type StudioMode } from '@/components/library/LibraryBar';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { validateLayout, type LayoutIssue } from '@/lib/designer/validate';
import { useLibrary, type UseLibraryOptions } from '@/hooks/use-library';
import type { Board } from '@/lib/engine/board';
import type { GameState } from '@/lib/engine/game';
import { applyStartToPlayers, ensureBoardLayout } from '@/lib/engine/layout';
import type { PlayerState } from '@/lib/engine/players';
import { cloneJson, fromStoredBootstrap } from '@/lib/library/bootstrap';
import type { NewGameSource } from '@/lib/library/types';
import { waitUntilPlayCanvasSlotFree } from '@/lib/view/playcanvas-lifecycle';

export function StudioShell(options: UseLibraryOptions = {}) {
  const { active, activeId, drafts, ready, newGame, openGame, saveActive } =
    useLibrary(options);
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);
  const [mode, setMode] = useState<StudioMode>('design');
  const [workingBoard, setWorkingBoard] = useState<Board | null>(null);
  const [workingPlayers, setWorkingPlayers] = useState<PlayerState | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [tool, setTool] = useState<DesignerTool>('select');
  const [issues, setIssues] = useState<LayoutIssue[]>([]);
  const [testNonce, setTestNonce] = useState(0);
  const [testViewportReady, setTestViewportReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setWorkingBoard(null);
      setWorkingPlayers(null);
      return;
    }
    const board = ensureBoardLayout(cloneJson(active.bootstrap.board));
    setWorkingBoard(board);
    setWorkingPlayers(cloneJson(active.bootstrap.players));
    setSelectedFloorId(board.floors[0]?.id ?? '');
    setSelectedCellId(null);
    setIssues([]);
    setMode('design');
    setSnapshot(null);
  }, [active?.id]);

  const persistWorking = useCallback(() => {
    if (!active || !workingBoard || !workingPlayers) return;
    saveActive({
      board: cloneJson(workingBoard),
      players: applyStartToPlayers(cloneJson(workingPlayers), workingBoard),
      cards: snapshot?.cards.deck ?? active.bootstrap.cards,
      config: snapshot?.config ?? active.bootstrap.config,
    });
  }, [active, workingBoard, workingPlayers, snapshot, saveActive]);

  const onCreate = (input: { name: string; source: NewGameSource }) => {
    persistWorking();
    newGame(input);
    setNewOpen(false);
  };

  const onOpenDraft = (id: string) => {
    persistWorking();
    openGame(id);
    setOpenOpen(false);
  };

  const onTest = () => {
    if (!workingBoard) return;
    const nextIssues = validateLayout(workingBoard);
    setIssues(nextIssues);
    if (nextIssues.length > 0) {
      setMode('design');
      return;
    }
    persistWorking();
    setTestViewportReady(false);
    setTestNonce((n) => n + 1);
    setMode('test');
  };

  useEffect(() => {
    if (mode !== 'test') {
      setTestViewportReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      await waitUntilPlayCanvasSlotFree(3);
      if (!cancelled) setTestViewportReady(true);
    })();
    return () => {
      cancelled = true;
      setTestViewportReady(false);
    };
  }, [mode, testNonce]);

  if (!ready) {
    return <p className="text-slate-400">Loading library…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <LibraryBar
        activeName={active?.name ?? 'No game'}
        savedAt={active?.updatedAt}
        canSave={Boolean(active)}
        mode={mode}
        onNew={() => setNewOpen(true)}
        onSave={persistWorking}
        onOpen={() => setOpenOpen(true)}
        onDesign={() => setMode('design')}
        onTest={onTest}
      />
      {active && workingBoard && workingPlayers ? (
        mode === 'design' ? (
          <LayoutDesigner
            board={workingBoard}
            cards={snapshot?.cards.deck ?? active.bootstrap.cards}
            selectedFloorId={selectedFloorId || workingBoard.floors[0]!.id}
            selectedCellId={selectedCellId}
            tool={tool}
            issues={issues}
            onBoardChange={setWorkingBoard}
            onSelectFloor={setSelectedFloorId}
            onSelectCell={setSelectedCellId}
            onToolChange={setTool}
          />
        ) : testViewportReady ? (
          <GameHud
            key={`${active.id}-test-${testNonce}`}
            bootstrap={fromStoredBootstrap({
              board: workingBoard,
              players: applyStartToPlayers(workingPlayers, workingBoard),
              cards: snapshot?.cards.deck ?? active.bootstrap.cards,
              config: snapshot?.config ?? active.bootstrap.config,
            })}
            onStateChange={setSnapshot}
          />
        ) : null
      ) : (
        <p className="text-slate-400">Create a game to start playing.</p>
      )}
      <NewGameDialog open={newOpen} onOpenChange={setNewOpen} onCreate={onCreate} />
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
