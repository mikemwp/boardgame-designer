import { assignStartingItems, itemNames, startingItems } from '@/lib/engine/inventory';
import type { InventoryItem } from '@/lib/engine/types';

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

export function updateItem(
  list: InventoryItem[],
  id: string,
  patch: Partial<Pick<InventoryItem, 'name' | 'starting'>>,
): InventoryItem[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    const next = { ...item };
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return item;
      next.name = name;
    }
    if (patch.starting !== undefined) next.starting = patch.starting;
    return next;
  });
}

export function deleteItem(list: InventoryItem[], id: string): InventoryItem[] {
  return list.filter((item) => item.id !== id);
}
