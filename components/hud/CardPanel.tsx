'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { allowedActions } from '@/lib/engine/cards';
import type { ActionMode, Card as CardType } from '@/lib/engine/types';
import type { GameCommand } from '@/lib/engine/events';

export function CardPanel({
  actionMode,
  currentCard,
  bodyVisible = false,
  awaitingAction = false,
  onDispatch,
}: {
  actionMode: ActionMode;
  currentCard: CardType | null;
  bodyVisible?: boolean;
  awaitingAction?: boolean;
  onDispatch: (cmd: GameCommand) => void;
}) {
  const actions = awaitingAction ? allowedActions(actionMode) : [];
  if (!currentCard) return <p className="text-slate-400">No card drawn</p>;
  return (
    <Card>
      <CardHeader><CardTitle>{currentCard.title}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        {bodyVisible && currentCard.body ? (
          <p className="text-sm text-slate-300">{currentCard.body}</p>
        ) : null}
        {actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.includes('positive') && (
              <Button onClick={() => onDispatch({ type: 'REVEAL_CARD', packId: currentCard.pack })}>Play</Button>
            )}
            {actions.includes('pass') && (
              <Button variant="secondary" onClick={() => onDispatch({ type: 'PASS_CARD', packId: currentCard.pack })}>Pass</Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
