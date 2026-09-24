'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import type { DesignerTool } from '@/components/designer/DesignerPalette';
import { GameHud } from '@/components/hud/GameHud';
import { DeleteGameDialog } from '@/components/library/DeleteGameDialog';
import { LibraryBar, type StudioMode } from '@/components/library/LibraryBar';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { UnsavedChangesDialog } from '@/components/library/UnsavedChangesDialog';
import { preferredMovementViz } from '@/lib/designer/hud';
import { listDraftPackIds } from '@/lib/designer/packs';
import { canPublishPlay, validateLayout, type LayoutIssue } from '@/lib/designer/validate';
import { useLibrary, type UseLibraryOptions } from '@/hooks/use-library';
import { isPublished } from '@/lib/library/state';
import { formatGameTitle } from '@/lib/library/version';
import type { Board } from '@/lib/engine/board';
import type { GameState } from '@/lib/engine/game';
import { applyStartToPlayers, ensureBoardLayout } from '@/lib/engine/layout';
import type { PlayerState } from '@/lib/engine/players';
import { emptyGameStart } from '@/lib/engine/audio';
import type { Card, GameStart } from '@/lib/engine/types';
import { cloneJson, fromStoredBootstrap, storedPackIds } from '@/lib/library/bootstrap';
import { browserMediaStore } from '@/lib/library/media-store';
import type { NewGameInput } from '@/lib/library/types';
import { waitUntilPlayCanvasSlotFree } from '@/lib/view/playcanvas-lifecycle';

function snapshotKey(
  board: Board | null,
  players: PlayerState | null,
  cards: Card[] = [],
  packs: string[] = [],
  gameStart: GameStart = emptyGameStart(),
): string {
  return JSON.stringify({ board, players, cards, packs, gameStart });
}

export function StudioShell(options: UseLibraryOptions = {}) {
  const [media] = useState(() => options.media ?? browserMediaStore());
  const {
    active,
    activeId,
    drafts,
    ready,
    newGame,
    openGame,
    saveActive,
    markActiveEdited,
    deleteActive,
    publishActive,
  } = useLibrary({ ...options, media });
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dirtyPrompt, setDirtyPrompt] = useState<'new' | 'open' | null>(null);
  const [mode, setMode] = useState<StudioMode>('design');
  const [workingBoard, setWorkingBoard] = useState<Board | null>(null);
  const [workingPlayers, setWorkingPlayers] = useState<PlayerState | null>(null);
  const [workingCards, setWorkingCards] = useState<Card[]>([]);
  const [workingPacks, setWorkingPacks] = useState<string[]>([]);
  const [workingGameStart, setWorkingGameStart] = useState<GameStart>(emptyGameStart());
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [tool, setTool] = useState<DesignerTool>('select');
  const [issues, setIssues] = useState<LayoutIssue[]>([]);
  const [testNonce, setTestNonce] = useState(0);
  const [testViewportReady, setTestViewportReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const savedKeyRef = useRef('');

  useEffect(() => {
    if (!active) {
      setWorkingBoard(null);
      setWorkingPlayers(null);
      setWorkingCards([]);
      setWorkingPacks([]);
      setWorkingGameStart(emptyGameStart());
      setDirty(false);
      savedKeyRef.current = '';
      return;
    }
    const board = ensureBoardLayout(cloneJson(active.bootstrap.board));
    const players = cloneJson(active.bootstrap.players);
    const cards = cloneJson(active.bootstrap.cards);
    const packs = storedPackIds(active.bootstrap);
    const gameStart = cloneJson(active.bootstrap.gameStart ?? emptyGameStart());
    setWorkingBoard(board);
    setWorkingPlayers(players);
    setWorkingCards(cards);
    setWorkingPacks(packs);
    setWorkingGameStart(gameStart);
    setSelectedFloorId(board.floors[0]?.id ?? '');
    setSelectedCellId(null);
    setIssues([]);
    setMode('design');
    setSnapshot(null);
    setDirty(false);
    savedKeyRef.current = snapshotKey(board, players, cards, packs, gameStart);
  }, [active?.id]);

  const persistWorking = useCallback(
    (options?: { touchUpdatedAt?: boolean; bump?: 'none' | 'save' }) => {
      if (!active || !workingBoard || !workingPlayers) return;
      const cards = cloneJson(workingCards);
      const packs = listDraftPackIds(cards, workingPacks);
      saveActive(
        {
          board: cloneJson(workingBoard),
          players: applyStartToPlayers(cloneJson(workingPlayers), workingBoard),
          cards,
          packs,
          config: snapshot?.config ?? active.bootstrap.config,
          gameStart: cloneJson(workingGameStart),
        },
        options,
      );
      if (options?.touchUpdatedAt !== false && options?.bump === 'save') {
        savedKeyRef.current = snapshotKey(workingBoard, workingPlayers, cards, packs, workingGameStart);
        setDirty(false);
      }
    },
    [active, workingBoard, workingPlayers, workingCards, workingPacks, workingGameStart, snapshot, saveActive],
  );

  const skipAutoSaveRef = useRef(true);

  useEffect(() => {
    skipAutoSaveRef.current = true;
  }, [active?.id]);

  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    if (!active || !workingBoard || !workingPlayers) return;
    const timer = window.setTimeout(() => persistWorking({ touchUpdatedAt: false }), 400);
    return () => window.clearTimeout(timer);
  }, [active?.id, workingBoard, workingPlayers, workingCards, workingPacks, workingGameStart, persistWorking]);

  useEffect(() => {
    const onPageHide = () => persistWorking({ touchUpdatedAt: false });
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [persistWorking]);

  useEffect(() => {
    if (!snapshot) return;
    const deck = snapshot.cards.deck;
    setWorkingCards((prev) => (JSON.stringify(prev) === JSON.stringify(deck) ? prev : cloneJson(deck)));
    setWorkingPacks((prev) => listDraftPackIds(deck, prev));
  }, [snapshot]);

  const markDirtyIfChanged = (
    board: Board | null,
    players: PlayerState | null,
    cards: Card[],
    packs: string[],
    gameStart: GameStart = workingGameStart,
  ) => {
    if (snapshotKey(board, players, cards, packs, gameStart) !== savedKeyRef.current) {
      setDirty(true);
    }
  };

  const onGameStartChange = (next: GameStart) => {
    setWorkingGameStart(next);
    if (active) markActiveEdited();
    markDirtyIfChanged(workingBoard, workingPlayers, workingCards, workingPacks, next);
  };

  const onBoardChange = (board: Board) => {
    setWorkingBoard(board);
    if (active) markActiveEdited();
    markDirtyIfChanged(board, workingPlayers, workingCards, workingPacks);
  };

  const onDraftChange = (next: { cards: Card[]; packs: string[]; board: Board }) => {
    setWorkingCards(next.cards);
    setWorkingPacks(next.packs);
    if (next.board !== workingBoard) {
      onBoardChange(next.board);
      return;
    }
    if (active) markActiveEdited();
    markDirtyIfChanged(next.board, workingPlayers, next.cards, next.packs);
  };

  const requestLeave = (kind: 'new' | 'open') => {
    if (dirty) {
      setDirtyPrompt(kind);
      return;
    }
    if (kind === 'new') setNewOpen(true);
    else setOpenOpen(true);
  };

  const finishDirtyPrompt = (save: boolean) => {
    const next = dirtyPrompt;
    setDirtyPrompt(null);
    if (save) persistWorking({ touchUpdatedAt: true, bump: 'save' });
    if (next === 'new') setNewOpen(true);
    if (next === 'open') setOpenOpen(true);
  };

  const onCreate = (input: NewGameInput) => {
    persistWorking();
    newGame(input);
    setNewOpen(false);
  };

  const onOpenDraft = (id: string) => {
    persistWorking();
    openGame(id);
    setOpenOpen(false);
  };

  const onConfirmDelete = () => {
    if (!active || isPublished(active)) {
      setDeleteOpen(false);
      return;
    }
    setWorkingBoard(null);
    setWorkingPlayers(null);
    setWorkingCards([]);
    setWorkingPacks([]);
    setWorkingGameStart(emptyGameStart());
    setSnapshot(null);
    deleteActive();
    setDeleteOpen(false);
  };

  const onSave = () => {
    persistWorking({ touchUpdatedAt: true, bump: 'save' });
  };

  const onPublish = () => {
    if (!workingBoard) return;
    const nextIssues = validateLayout(workingBoard);
    setIssues(nextIssues);
    if (nextIssues.length > 0) {
      setMode('design');
      return;
    }
    persistWorking({ touchUpdatedAt: true, bump: 'none' });
    publishActive();
  };

  const onTest = () => {
    if (!workingBoard) return;
    const nextIssues = validateLayout(workingBoard);
    setIssues(nextIssues);
    if (nextIssues.length > 0) {
      setMode('design');
      return;
    }
    persistWorking({ touchUpdatedAt: true, bump: 'save' });
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" data-testid="studio-shell">
      <div className="mb-2 flex shrink-0 items-center gap-3" data-testid="studio-header">
        <h1 className="shrink-0 text-2xl font-semibold text-slate-50">Building Board Template</h1>
        <LibraryBar
          activeName={formatGameTitle(active)}
          canSave={Boolean(active)}
          canTest={Boolean(active)}
          canPublish={Boolean(active && workingBoard && canPublishPlay(workingBoard))}
          mode={mode}
          onNew={() => requestLeave('new')}
          onSave={onSave}
          onOpen={() => requestLeave('open')}
          onDelete={() => {
            if (!active || isPublished(active)) return;
            setDeleteOpen(true);
          }}
          canDelete={Boolean(active) && !isPublished(active)}
          published={isPublished(active)}
          onDesign={() => setMode('design')}
          onTest={onTest}
          onPublish={onPublish}
        />
      </div>
      {active && workingBoard && workingPlayers ? (
        mode === 'design' ? (
          <LayoutDesigner
            board={workingBoard}
            cards={workingCards}
            packs={workingPacks}
            selectedFloorId={selectedFloorId || workingBoard.floors[0]!.id}
            selectedCellId={selectedCellId}
            tool={tool}
            issues={issues}
            onBoardChange={onBoardChange}
            onDraftChange={onDraftChange}
            onSelectFloor={setSelectedFloorId}
            onSelectCell={setSelectedCellId}
            onToolChange={setTool}
            gameStart={workingGameStart}
            onGameStartChange={onGameStartChange}
            gameId={active.id}
            media={media}
          />
        ) : testViewportReady ? (
          <GameHud
            key={`${active.id}-test-${testNonce}`}
            bootstrap={fromStoredBootstrap({
              board: workingBoard,
              players: applyStartToPlayers(workingPlayers, workingBoard),
              cards: workingCards,
              config: {
                ...(snapshot?.config ?? active.bootstrap.config),
                movementViz: preferredMovementViz(
                  workingBoard,
                  snapshot?.config.movementViz ?? active.bootstrap.config.movementViz,
                ),
              },
              gameStart: workingGameStart,
            })}
            gameStart={workingGameStart}
            gameId={active.id}
            media={media}
            onStateChange={setSnapshot}
          />
        ) : null
      ) : null}
      <NewGameDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={onCreate}
        games={drafts}
      />
      <DeleteGameDialog
        open={deleteOpen}
        gameName={active?.name ?? 'this draft'}
        onOpenChange={setDeleteOpen}
        onConfirm={onConfirmDelete}
      />
      <OpenGameDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        drafts={drafts}
        activeId={activeId}
        onOpen={onOpenDraft}
      />
      <UnsavedChangesDialog
        open={dirtyPrompt !== null}
        gameName={active?.name ?? 'This game'}
        onOpenChange={(open) => {
          if (!open) setDirtyPrompt(null);
        }}
        onSave={() => finishDirtyPrompt(true)}
        onDiscard={() => finishDirtyPrompt(false)}
      />
    </div>
  );
}
