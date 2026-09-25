import { assignStartingItems, itemNames, startingItems } from '@/lib/engine/inventory';
import type { Board } from '@/lib/engine/board';
import type { Card, InventoryItem } from '@/lib/engine/types';

export { assignStartingItems, itemNames, startingItems };

export function nextItemId(existing: InventoryItem[]): string {
  let n = 1;
  const used = new Set(existing.map((item) => item.id));
  while (used.has(`item-${n}`)) n += 1;
  return `item-${n}`;
}

export function createItem(list: InventoryItem[], id: string): InventoryItem[] {
  const trimmed = id.trim();
  if (!trimmed || list.some((item) => item.id === trimmed)) return list;
  return [...list, { id: trimmed, name: `Item ${list.length + 1}`, starting: false }];
}

type ItemPatch = Partial<
  Pick<
    InventoryItem,
    'name' | 'starting' | 'description' | 'usageNotes' | 'usesRemaining' | 'image' | 'video' | 'audio'
  >
>;

export function updateItem(list: InventoryItem[], id: string, patch: ItemPatch): InventoryItem[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    const next: InventoryItem = { ...item };
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return item;
      next.name = name;
    }
    if (patch.starting !== undefined) next.starting = patch.starting;
    if (patch.description !== undefined) {
      const description = patch.description.trim();
      if (description) next.description = description;
      else delete next.description;
    }
    if (patch.usageNotes !== undefined) {
      const usageNotes = patch.usageNotes.trim();
      if (usageNotes) next.usageNotes = usageNotes;
      else delete next.usageNotes;
    }
    if (patch.usesRemaining !== undefined) {
      const uses = Number.isFinite(patch.usesRemaining) ? Math.floor(patch.usesRemaining) : 0;
      if (uses > 0) next.usesRemaining = uses;
      else delete next.usesRemaining;
    }
    if ('image' in patch) {
      if (patch.image) next.image = patch.image;
      else delete next.image;
    }
    if ('video' in patch) {
      if (patch.video) next.video = patch.video;
      else delete next.video;
    }
    if ('audio' in patch) {
      if (patch.audio) next.audio = patch.audio;
      else delete next.audio;
    }
    return next;
  });
}

export function deleteItem(list: InventoryItem[], id: string): InventoryItem[] {
  return list.filter((item) => item.id !== id);
}

export function rewriteItemId<T extends { itemId?: string }>(
  value: T,
  from: string,
  to: string | undefined,
): T {
  if (value.itemId !== from) return value;
  if (to === undefined) {
    const { itemId: _drop, ...rest } = value;
    return rest as T;
  }
  return { ...value, itemId: to };
}

export function rewriteItemRefs(
  board: Board,
  cards: Card[],
  from: string,
  to: string | undefined,
): { board: Board; cards: Card[] } {
  return {
    board: {
      ...board,
      floors: board.floors.map((floor) => ({
        ...floor,
        cells: floor.cells.map((cell) => rewriteItemId(cell, from, to)),
      })),
    },
    cards: cards.map((card) => rewriteItemId(card, from, to)),
  };
}
