'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cardsInPack } from '@/lib/designer/packs';
import type { Card } from '@/lib/engine/types';

export function PackEditor({
  packs,
  cards,
  selectedPackId,
  selectedCardId,
  onSelectPack,
  onSelectCard,
  onCreatePack,
  onRenamePack,
  onDeletePack,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
}: {
  packs: string[];
  cards: Card[];
  selectedPackId: string | null;
  selectedCardId: string | null;
  onSelectPack: (id: string | null) => void;
  onSelectCard: (id: string | null) => void;
  onCreatePack: () => void;
  onRenamePack: (nextId: string) => void;
  onDeletePack: () => void;
  onCreateCard: () => void;
  onUpdateCard: (patch: Partial<Pick<Card, 'title' | 'body' | 'timerSeconds' | 'extraButton'>>) => void;
  onDeleteCard: () => void;
}) {
  const [draftPackId, setDraftPackId] = useState(selectedPackId ?? '');
  useEffect(() => {
    setDraftPackId(selectedPackId ?? '');
  }, [selectedPackId]);

  const selectedCards = selectedPackId ? cardsInPack(cards, selectedPackId) : [];
  const selectedCard = selectedCards.find((card) => card.id === selectedCardId);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="pack-editor">
      <p className="text-sm font-medium text-slate-100">Packs</p>
      <Button type="button" variant="outline" onClick={onCreatePack}>
        New pack
      </Button>
      {packs.length === 0 ? (
        <p className="text-sm text-slate-400">
          No packs yet. Create a pack to attach to tiles, or import a CSV in Test.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {packs.map((id) => {
            const count = cardsInPack(cards, id).length;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-label={`Select pack ${id}`}
                  aria-pressed={selectedPackId === id}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm ${
                    selectedPackId === id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                  }`}
                  onClick={() => onSelectPack(id)}
                >
                  <span>{id}</span>
                  <span className="text-xs text-slate-400">
                    {count} {count === 1 ? 'card' : 'cards'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selectedPackId ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pack-id">Pack id</Label>
            <Input
              id="pack-id"
              aria-label="Pack id"
              value={draftPackId}
              onChange={(e) => setDraftPackId(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onRenamePack(draftPackId)}>
                Rename pack
              </Button>
              <Button type="button" variant="outline" onClick={onDeletePack}>
                Delete pack
              </Button>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-100">Cards</p>
          <Button type="button" variant="outline" onClick={onCreateCard}>
            New card
          </Button>
          {selectedCards.length === 0 ? (
            <p className="text-sm text-slate-400">This pack has no cards yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {selectedCards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    aria-label={`Select card ${card.title}`}
                    aria-pressed={selectedCardId === card.id}
                    className={`w-full rounded-md px-2 py-1 text-left text-sm ${
                      selectedCardId === card.id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                    }`}
                    onClick={() => onSelectCard(card.id)}
                  >
                    {card.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedCard ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-title">Title</Label>
              <Input
                id="card-title"
                aria-label="Title"
                value={selectedCard.title}
                onChange={(e) => onUpdateCard({ title: e.target.value })}
              />
              <Label htmlFor="card-body">Body</Label>
              <textarea
                id="card-body"
                aria-label="Body"
                value={selectedCard.body ?? ''}
                onChange={(e) => onUpdateCard({ body: e.target.value })}
                className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm text-slate-50 outline-none"
              />
              <Label htmlFor="card-timer">Timer seconds</Label>
              <Input
                id="card-timer"
                type="number"
                aria-label="Timer seconds"
                value={selectedCard.timerSeconds ?? ''}
                onChange={(e) => onUpdateCard({ timerSeconds: Number(e.target.value) })}
              />
              <Label htmlFor="card-extra-button">Extra button</Label>
              <Input
                id="card-extra-button"
                aria-label="Extra button"
                value={selectedCard.extraButton ?? ''}
                onChange={(e) => onUpdateCard({ extraButton: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={onDeleteCard}>
                Delete card
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
