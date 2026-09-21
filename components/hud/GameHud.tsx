'use client';

import { useState } from 'react';
import { BoardScene } from '@/components/board/BoardScene';
import { Button } from '@/components/ui/button';
import { CardPanel } from '@/components/hud/CardPanel';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { PlayerBar } from '@/components/hud/PlayerBar';
import { useGameStore } from '@/hooks/use-game-store';
import type { GameBootstrap } from '@/lib/engine/game';

export function GameHud({ bootstrap }: { bootstrap: GameBootstrap }) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <BoardScene game={game} />
        <PlayerBar
          players={game.players.players}
          activePlayerId={game.players.activePlayerId}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => dispatch({ type: 'ROLL_DICE' })}>
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
          currentCard={game.cards.currentCard}
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
