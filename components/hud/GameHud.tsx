'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardScene } from '@/components/board/BoardScene';
import { Button } from '@/components/ui/button';
import { CardPanel } from '@/components/hud/CardPanel';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { HoldStatus } from '@/components/hud/HoldStatus';
import { PassStatus } from '@/components/hud/PassStatus';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { LastRoll } from '@/components/hud/LastRoll';
import { MovementStage } from '@/components/hud/MovementStage';
import { PlayerBar } from '@/components/hud/PlayerBar';
import { useGameStore } from '@/hooks/use-game-store';
import { listHudWidgets } from '@/lib/designer/hud';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  type MovementPhase,
} from '@/lib/view/hud-movement';
import { formatCardTimer, isCardHoldActive } from '@/lib/view/card-hold';
import { isRollLocked, shouldShowDealtCard } from '@/lib/view/turn-loop';

export function GameHud({
  bootstrap,
  onStateChange,
}: {
  bootstrap: GameBootstrap;
  onStateChange?: (game: GameState) => void;
}) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    onStateChange?.(game);
  }, [game, onStateChange]);
  const [tokenSliding, setTokenSliding] = useState(false);
  const [phase, setPhase] = useState<MovementPhase>('idle');
  const [cardHoldReleased, setCardHoldReleased] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const seenRollId = useRef(0);
  const holdFloor = game.board.floors.find((f) => f.id === game.hold?.floorId);
  const activePlayer = game.players.players.find((p) => p.id === game.players.activePlayerId);
  const movementVizActive = isMovementVizActive(phase);

  useEffect(() => {
    const roll = game.lastRoll;
    if (!roll || roll.id === seenRollId.current) return;
    seenRollId.current = roll.id;
    setPhase(phaseAfterNewRoll(roll.value));
  }, [game.lastRoll]);

  const visibleCard = shouldShowDealtCard({
    tokenSliding,
    currentCard: game.cards.currentCard,
    movementVizActive,
  })
    ? game.cards.currentCard
    : null;

  useEffect(() => {
    setCardHoldReleased(false);
  }, [game.cards.currentCard?.id]);

  const cardHoldActive = isCardHoldActive({
    currentCard: visibleCard,
    bodyVisible: game.cards.bodyVisible,
    released: cardHoldReleased,
  });
  const rollLocked = isRollLocked({
    tokenSliding,
    awaitingAction: game.cards.awaitingAction,
    movementVizActive,
    cardHoldActive,
  });

  const timerSeconds = visibleCard?.timerSeconds ?? 0;
  const timerRunning = timerSeconds > 0 && game.cards.bodyVisible && !cardHoldReleased;

  useEffect(() => {
    if (!timerRunning) {
      setTimerRemaining(null);
      return;
    }
    setTimerRemaining(timerSeconds);
    const timeout = setTimeout(() => setCardHoldReleased(true), timerSeconds * 1000);
    const interval = setInterval(() => {
      setTimerRemaining((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const onTokenSlideStart = useCallback(() => setTokenSliding(true), []);
  const onTumbleComplete = useCallback(() => {
    setPhase((current) => phaseAfterTumble(current));
  }, []);
  const onTokenSlideComplete = useCallback(() => {
    setTokenSliding(false);
    setPhase((current) => phaseAfterSlide(current));
  }, []);

  const spinner = game.config.movementViz === 'spinner';
  const widgets = listHudWidgets(game.board);
  const designedHud = widgets.some((widget) => widget !== 'empty');
  const showPlayerBar = !designedHud || widgets.includes('player-bar');
  const showLastRoll = !designedHud || widgets.includes('last-roll');

  return (
    <div
      className="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,max-content)_minmax(0,16rem)]"
      data-testid="test-hud"
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
        <BoardScene
          game={game}
          allowSlide={shouldAllowTokenSlide(phase)}
          onTokenSlideStart={onTokenSlideStart}
          onTokenSlideComplete={onTokenSlideComplete}
        />
        {showPlayerBar ? (
          <PlayerBar
            players={game.players.players}
            activePlayerId={game.players.activePlayerId}
          />
        ) : null}
        <MovementStage
          viz={game.config.movementViz}
          lastRoll={game.lastRoll}
          diceCount={game.config.diceCount}
          phase={phase}
          onTumbleComplete={onTumbleComplete}
        />
        {showLastRoll ? (
          <LastRoll lastRoll={game.lastRoll} movementViz={game.config.movementViz} />
        ) : null}
        <HoldStatus hold={game.hold} floorLabel={holdFloor?.label ?? 'this floor'} />
        <PassStatus
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => dispatch({ type: 'ROLL_DICE' })}
            disabled={rollLocked}
          >
            {spinner ? 'Spin' : 'Roll dice'}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import cards
          </Button>
        </div>
      </div>
      <aside className="flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto">
        <FeatureToggles config={game.config} onChange={updateConfig} />
        <CardPanel
          actionMode={game.config.actionMode}
          currentCard={visibleCard}
          bodyVisible={game.cards.bodyVisible}
          awaitingAction={game.cards.awaitingAction}
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
          timerLabel={timerRemaining != null ? formatCardTimer(timerRemaining) : undefined}
          onExtra={() => setCardHoldReleased(true)}
          onDispatch={dispatch}
        />
      </aside>
      <ImportCardsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importCards}
      />
    </div>
  );
}
