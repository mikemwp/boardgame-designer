'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { allowedActions } from '@/lib/engine/cards';
import type { ActionMode, Card as CardType } from '@/lib/engine/types';
import type { GameCommand } from '@/lib/engine/events';

export function CardPanel({
  actionMode,
  currentCard,
  onDispatch,
}: {
  actionMode: ActionMode;
  currentCard: CardType | null;
  onDispatch: (cmd: GameCommand) => void;
}) {
  const actions = allowedActions(actionMode);
  if (!currentCard) return <p className="text-slate-400">No card drawn</p>;
  return (
    <Card>
      <CardHeader><CardTitle>{currentCard.title}</CardTitle></CardHeader>
      <CardContent className="flex gap-2">
        {actions.includes('positive') && (
          <Button onClick={() => onDispatch({ type: 'REVEAL_CARD', packId: currentCard.pack })}>Play</Button>
        )}
        {actions.includes('pass') && (
          <Button variant="secondary" onClick={() => onDispatch({ type: 'PASS_CARD', packId: currentCard.pack })}>Pass</Button>
        )}
      </CardContent>
    </Card>
  );
}
