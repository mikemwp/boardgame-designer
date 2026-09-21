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
import type { GameBootstrap } from '@/lib/engine/game';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  type MovementPhase,
} from '@/lib/view/hud-movement';
import { isRollLocked, shouldShowDealtCard } from '@/lib/view/turn-loop';

export function GameHud({ bootstrap }: { bootstrap: GameBootstrap }) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);
  const [tokenSliding, setTokenSliding] = useState(false);
  const [phase, setPhase] = useState<MovementPhase>('idle');
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

  const rollLocked = isRollLocked({
    tokenSliding,
    awaitingAction: game.cards.awaitingAction,
    movementVizActive,
  });
  const visibleCard = shouldShowDealtCard({
    tokenSliding,
    currentCard: game.cards.currentCard,
    movementVizActive,
  })
    ? game.cards.currentCard
    : null;

  const onTokenSlideStart = useCallback(() => setTokenSliding(true), []);
  const onTumbleComplete = useCallback(() => {
    setPhase((current) => phaseAfterTumble(current));
  }, []);
  const onTokenSlideComplete = useCallback(() => {
    setTokenSliding(false);
    setPhase((current) => phaseAfterSlide(current));
  }, []);

  const spinner = game.config.movementViz === 'spinner';

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <BoardScene
          game={game}
          allowSlide={shouldAllowTokenSlide(phase)}
          onTokenSlideStart={onTokenSlideStart}
          onTokenSlideComplete={onTokenSlideComplete}
        />
        <PlayerBar
          players={game.players.players}
          activePlayerId={game.players.activePlayerId}
        />
        <MovementStage
          viz={game.config.movementViz}
          lastRoll={game.lastRoll}
          diceCount={game.config.diceCount}
          phase={phase}
          onTumbleComplete={onTumbleComplete}
        />
        <LastRoll lastRoll={game.lastRoll} movementViz={game.config.movementViz} />
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
      <aside className="flex flex-col gap-4">
        <FeatureToggles config={game.config} onChange={updateConfig} />
        <CardPanel
          actionMode={game.config.actionMode}
          currentCard={visibleCard}
          bodyVisible={game.cards.bodyVisible}
          awaitingAction={game.cards.awaitingAction}
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
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
