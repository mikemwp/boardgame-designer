'use client';

import { useCallback, useState } from 'react';
import { BoardScene } from '@/components/board/BoardScene';
import { Button } from '@/components/ui/button';
import { CardPanel } from '@/components/hud/CardPanel';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { HoldStatus } from '@/components/hud/HoldStatus';
import { PassStatus } from '@/components/hud/PassStatus';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { LastRoll } from '@/components/hud/LastRoll';
import { PlayerBar } from '@/components/hud/PlayerBar';
import { useGameStore } from '@/hooks/use-game-store';
import type { GameBootstrap } from '@/lib/engine/game';
import { isRollLocked, shouldShowDealtCard } from '@/lib/view/turn-loop';

export function GameHud({ bootstrap }: { bootstrap: GameBootstrap }) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);
  const [tokenSliding, setTokenSliding] = useState(false);
  const holdFloor = game.board.floors.find((f) => f.id === game.hold?.floorId);
  const activePlayer = game.players.players.find((p) => p.id === game.players.activePlayerId);

  const rollLocked = isRollLocked({
    tokenSliding,
    awaitingAction: game.cards.awaitingAction,
  });
  const visibleCard = shouldShowDealtCard({
    tokenSliding,
    currentCard: game.cards.currentCard,
  })
    ? game.cards.currentCard
    : null;

  const onTokenSlideStart = useCallback(() => setTokenSliding(true), []);
  const onTokenSlideComplete = useCallback(() => setTokenSliding(false), []);

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <BoardScene
          game={game}
          onTokenSlideStart={onTokenSlideStart}
          onTokenSlideComplete={onTokenSlideComplete}
        />
        <PlayerBar
          players={game.players.players}
          activePlayerId={game.players.activePlayerId}
        />
        <LastRoll lastRoll={game.lastRoll} />
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
            Roll dice
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
