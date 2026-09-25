'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { allowedActions } from '@/lib/engine/cards';
import { passActionAllowed } from '@/lib/engine/passes';
import { cardBackImage } from '@/lib/designer/packs';
import type { ActionMode, Card as CardType, ImageRef, MovementViz } from '@/lib/engine/types';
import type { GameCommand } from '@/lib/engine/events';

export function CardPanel({
  actionMode,
  currentCard,
  bodyVisible = false,
  awaitingAction = false,
  passesEnabled = false,
  passesLeftByPack = {},
  timerLabel,
  onExtra,
  onDispatch,
  packBack,
  movementViz = 'dice',
}: {
  actionMode: ActionMode;
  currentCard: CardType | null;
  bodyVisible?: boolean;
  awaitingAction?: boolean;
  passesEnabled?: boolean;
  passesLeftByPack?: Record<string, number>;
  timerLabel?: string;
  onExtra?: () => void;
  onDispatch: (cmd: GameCommand) => void;
  packBack?: ImageRef;
  movementViz?: MovementViz;
}) {
  const actions = awaitingAction ? allowedActions(actionMode) : [];
  const showPass = currentCard
    ? passActionAllowed(actionMode, passesEnabled, passesLeftByPack, currentCard.pack)
    : false;
  const extraLabel =
    currentCard?.cardType === 'timer'
      ? (currentCard.timerButtonLabel?.trim() || 'Start timer')
      : currentCard?.extraButton?.trim();
  const continueLabel = currentCard?.continueLabel?.trim() || 'Continue forward';
  const turnLabel = currentCard?.turnLabel?.trim() || 'Make turn';
  if (!currentCard) return <p className="text-slate-400">No card drawn</p>;
  const back = cardBackImage(currentCard, packBack);
  return (
    <Card>
      <CardHeader><CardTitle>{currentCard.title}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        {back ? (
          back.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Card back" src={back.src} className="max-h-40 w-full object-contain" />
          ) : (
            <p data-testid="card-back">{back.name}</p>
          )
        ) : null}
        {bodyVisible && currentCard.body ? (
          <p className="text-sm text-slate-300">{currentCard.body}</p>
        ) : null}
        {timerLabel != null ? (
          <p data-testid="card-timer">{timerLabel}</p>
        ) : null}
        {bodyVisible && extraLabel ? (
          <Button onClick={() => onExtra?.()}>{extraLabel}</Button>
        ) : null}
        {bodyVisible && currentCard.cardType === 'roll-again' ? (
          <Button onClick={() => onExtra?.()}>
            {movementViz === 'spinner' ? 'Spin again' : 'Roll again'}
          </Button>
        ) : null}
        {bodyVisible && currentCard.cardType === 'change-direction-choice' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDispatch({ type: 'CHOOSE_DIRECTION', choice: 'forward' })}
            >
              {continueLabel}
            </Button>
            <Button type="button" onClick={() => onDispatch({ type: 'CHOOSE_DIRECTION', choice: 'turn' })}>
              {turnLabel}
            </Button>
          </div>
        ) : null}
        {currentCard.spinnerId ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onDispatch({ type: 'SPIN_OUTCOME', spinnerId: currentCard.spinnerId! })}
          >
            Spin outcome
          </Button>
        ) : null}
        {actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.includes('positive') && (
              <Button onClick={() => onDispatch({ type: 'REVEAL_CARD', packId: currentCard.pack })}>Play</Button>
            )}
            {actions.includes('pass') && showPass && (
              <Button variant="secondary" onClick={() => onDispatch({ type: 'PASS_CARD', packId: currentCard.pack })}>Pass</Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
