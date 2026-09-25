'use client';

import { useEffect, useState } from 'react';
import { AudioField, MediaField } from '@/components/designer/AudioField';
import { LevelConfirmDialog } from '@/components/designer/LevelConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cardsInPack } from '@/lib/designer/packs';
import type { Card, ImageRef, InventoryItem, SpinnerDef } from '@/lib/engine/types';
import type { CopyCardSource, CopyPackSource } from '@/lib/library/floating';
import type { MediaStore } from '@/lib/library/media-store';

function packSourceLabel(source: CopyPackSource): string {
  return source.kind === 'game' ? `${source.gameName} ${source.packName}` : source.packName;
}

function packSourceKey(source: CopyPackSource): string {
  return source.kind === 'game' ? `game:${source.gameId}:${source.packName}` : `float:${source.floatingId}`;
}

function cardSourceLabel(source: CopyCardSource): string {
  return source.kind === 'game'
    ? `${source.gameName} ${source.packName} ${source.cardTitle}`
    : source.cardTitle;
}

function cardSourceKey(source: CopyCardSource): string {
  return source.kind === 'game' ? `game:${source.gameId}:${source.cardId}` : `float:${source.cardId}`;
}

export function PackEditor({
  packs,
  cards,
  selectedPackId,
  selectedCardId,
  onSelectPack,
  onSelectCard,
  onCreatePack,
  onCopyPack,
  onRenamePack,
  onRemovePack,
  onDeletePack,
  onCreateCard,
  onCopyCard,
  onUpdateCard,
  onRemoveCard,
  onDeleteCard,
  onSetPackBack,
  packBacks,
  copyPackSources = [],
  copyCardSources = [],
  spinners,
  items,
  gameId,
  media,
}: {
  packs: string[];
  cards: Card[];
  selectedPackId: string | null;
  selectedCardId: string | null;
  onSelectPack: (id: string | null) => void;
  onSelectCard: (id: string | null) => void;
  onCreatePack: () => void;
  onCopyPack?: (source: CopyPackSource) => void;
  onRenamePack: (nextId: string) => void;
  onRemovePack?: (packId: string) => void;
  onDeletePack: (packId: string) => void;
  onCreateCard: () => void;
  onCopyCard?: (source: CopyCardSource) => void;
  onUpdateCard: (
    patch: Partial<Pick<Card, 'title' | 'body' | 'timerSeconds' | 'extraButton' | 'audio' | 'spinnerId' | 'itemId' | 'image'>>,
  ) => void;
  onRemoveCard?: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSetPackBack?: (image: ImageRef | undefined) => void;
  packBacks?: Record<string, ImageRef>;
  copyPackSources?: CopyPackSource[];
  copyCardSources?: CopyCardSource[];
  spinners?: SpinnerDef[];
  items?: InventoryItem[];
  gameId?: string;
  media?: MediaStore;
}) {
  const [draftPackId, setDraftPackId] = useState(selectedPackId ?? '');
  const [copyPackOpen, setCopyPackOpen] = useState(false);
  const [copyCardOpen, setCopyCardOpen] = useState(false);
  const [packSourceKeyDraft, setPackSourceKeyDraft] = useState<string>('');
  const [cardSourceKeyDraft, setCardSourceKeyDraft] = useState<string>('');
  const [confirm, setConfirm] = useState<
    | { kind: 'remove-pack'; packId: string }
    | { kind: 'delete-pack'; packId: string }
    | { kind: 'remove-card'; cardId: string; title: string }
    | { kind: 'delete-card'; cardId: string; title: string }
    | null
  >(null);

  useEffect(() => {
    setDraftPackId(selectedPackId ?? '');
  }, [selectedPackId]);

  const selectedCards = selectedPackId ? cardsInPack(cards, selectedPackId) : [];
  const selectedCard = selectedCards.find((card) => card.id === selectedCardId);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="pack-editor">
      <p className="text-sm font-medium text-slate-100">Packs</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onCreatePack}>
          New pack
        </Button>
        <Button type="button" variant="outline" onClick={() => setCopyPackOpen(true)}>
          Copy pack
        </Button>
      </div>
      {packs.length === 0 ? (
        <p className="text-sm text-slate-400">
          No packs yet. Create a pack to attach to tiles, or copy one from another game.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {packs.map((id) => {
            const count = cardsInPack(cards, id).length;
            return (
              <li key={id} className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Select pack ${id}`}
                  aria-pressed={selectedPackId === id}
                  className={`min-w-0 flex-1 rounded-md px-2 py-1 text-left text-sm ${
                    selectedPackId === id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                  }`}
                  onClick={() => onSelectPack(id)}
                >
                  <span>{id}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {count} {count === 1 ? 'card' : 'cards'}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Remove pack ${id}`}
                  onClick={() => setConfirm({ kind: 'remove-pack', packId: id })}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Delete pack ${id}`}
                  onClick={() => setConfirm({ kind: 'delete-pack', packId: id })}
                >
                  Delete
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {selectedPackId ? (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                id="pack-name"
                aria-label="Pack name"
                value={draftPackId}
                onChange={(e) => setDraftPackId(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => onRenamePack(draftPackId)}>
              Rename pack
            </Button>
          </div>
          <MediaField
            kind="image"
            label="Back of pack"
            value={packBacks?.[selectedPackId]}
            gameId={gameId ?? 'draft'}
            media={media}
            onChange={(image) => onSetPackBack?.(image as ImageRef | undefined)}
            idPrefix={`pack-${selectedPackId}-back`}
          />
        </>
      ) : null}
      <p className="text-sm font-medium text-slate-100">Cards</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!selectedPackId} onClick={onCreateCard}>
          New card
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedPackId}
          onClick={() => setCopyCardOpen(true)}
        >
          Copy card
        </Button>
      </div>
      {selectedPackId ? (
        <>
          {selectedCards.length === 0 ? (
            <p className="text-sm text-slate-400">This pack has no cards yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {selectedCards.map((card) => (
                <li key={card.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Select card ${card.title}`}
                    aria-pressed={selectedCardId === card.id}
                    className={`min-w-0 flex-1 rounded-md px-2 py-1 text-left text-sm ${
                      selectedCardId === card.id ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-900'
                    }`}
                    onClick={() => onSelectCard(card.id)}
                  >
                    {card.title}
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove card ${card.title}`}
                    onClick={() => setConfirm({ kind: 'remove-card', cardId: card.id, title: card.title })}
                  >
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Delete card ${card.title}`}
                    onClick={() => setConfirm({ kind: 'delete-card', cardId: card.id, title: card.title })}
                  >
                    Delete
                  </Button>
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
              {items && items.length > 0 ? (
                <>
                  <Label htmlFor="card-item">Item</Label>
                  <select
                    id="card-item"
                    aria-label="Card item"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={selectedCard.itemId ?? ''}
                    onChange={(e) => onUpdateCard({ itemId: e.target.value || undefined })}
                  >
                    <option value="">None</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {spinners && spinners.length > 0 ? (
                <>
                  <Label htmlFor="card-spinner">Spinner</Label>
                  <select
                    id="card-spinner"
                    aria-label="Card spinner"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={selectedCard.spinnerId ?? ''}
                    onChange={(e) => onUpdateCard({ spinnerId: e.target.value || undefined })}
                  >
                    <option value="">None</option>
                    {spinners.map((spinner) => (
                      <option key={spinner.id} value={spinner.id}>
                        {spinner.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              <AudioField
                value={selectedCard.audio}
                gameId={gameId ?? 'draft'}
                media={media}
                onChange={(audio) => onUpdateCard({ audio })}
                idPrefix={`card-${selectedCard.id}`}
              />
              <MediaField
                kind="image"
                label="Card image"
                value={selectedCard.image}
                gameId={gameId ?? 'draft'}
                media={media}
                onChange={(image) => onUpdateCard({ image: image as ImageRef | undefined })}
                idPrefix={`card-${selectedCard.id}-image`}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog open={copyPackOpen} onOpenChange={setCopyPackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy pack</DialogTitle>
          </DialogHeader>
          {copyPackSources.length === 0 ? (
            <p className="text-sm text-slate-400">No other packs to copy yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {copyPackSources.map((source) => {
                const key = packSourceKey(source);
                const label = packSourceLabel(source);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="copy-pack-source"
                      aria-label={label}
                      checked={packSourceKeyDraft === key}
                      onChange={() => setPackSourceKeyDraft(key)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCopyPackOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!packSourceKeyDraft}
              onClick={() => {
                const source = copyPackSources.find((entry) => packSourceKey(entry) === packSourceKeyDraft);
                if (source) onCopyPack?.(source);
                setCopyPackOpen(false);
                setPackSourceKeyDraft('');
              }}
            >
              Copy into game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyCardOpen} onOpenChange={setCopyCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy card</DialogTitle>
          </DialogHeader>
          {copyCardSources.length === 0 ? (
            <p className="text-sm text-slate-400">No other cards to copy yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {copyCardSources.map((source) => {
                const key = cardSourceKey(source);
                const label = cardSourceLabel(source);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="copy-card-source"
                      aria-label={label}
                      checked={cardSourceKeyDraft === key}
                      onChange={() => setCardSourceKeyDraft(key)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCopyCardOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!cardSourceKeyDraft}
              onClick={() => {
                const source = copyCardSources.find((entry) => cardSourceKey(entry) === cardSourceKeyDraft);
                if (source) onCopyCard?.(source);
                setCopyCardOpen(false);
                setCardSourceKeyDraft('');
              }}
            >
              Copy into pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LevelConfirmDialog
        open={confirm?.kind === 'remove-pack'}
        title={`Remove ${confirm?.kind === 'remove-pack' ? confirm.packId : 'pack'}?`}
        description="The pack leaves this game and becomes a floating pack. Tiles and hold quotas that used it drop that pack."
        confirmLabel="Remove pack"
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm?.kind === 'remove-pack') onRemovePack?.(confirm.packId);
          setConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={confirm?.kind === 'delete-pack'}
        title={`Delete ${confirm?.kind === 'delete-pack' ? confirm.packId : 'pack'}?`}
        description="This destroys this game’s pack and this copy’s cards. Other games and floating originals stay."
        confirmLabel="Delete pack"
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm?.kind === 'delete-pack') onDeletePack(confirm.packId);
          setConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={confirm?.kind === 'remove-card'}
        title={`Remove ${confirm?.kind === 'remove-card' ? confirm.title : 'card'}?`}
        description="The card leaves this pack and becomes a floating card. You can copy it into a pack later."
        confirmLabel="Remove card"
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm?.kind === 'remove-card') onRemoveCard?.(confirm.cardId);
          setConfirm(null);
        }}
      />
      <LevelConfirmDialog
        open={confirm?.kind === 'delete-card'}
        title={`Delete ${confirm?.kind === 'delete-card' ? confirm.title : 'card'}?`}
        description="This destroys this copy’s contents. Other packs’ copies and any floating original stay."
        confirmLabel="Delete card"
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm?.kind === 'delete-card') onDeleteCard(confirm.cardId);
          setConfirm(null);
        }}
      />
    </div>
  );
}
