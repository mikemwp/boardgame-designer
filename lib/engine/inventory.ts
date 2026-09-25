import type { InventoryItem, ItemAssign, Player } from './types';
import type { PlayerState } from './players';

export function startingItems(list: InventoryItem[]): InventoryItem[] {
  return list.filter((item) => item.starting);
}

export function authoredUses(item: InventoryItem): number | undefined {
  const uses = item.usesRemaining;
  if (uses === undefined || !Number.isFinite(uses) || uses <= 0) return undefined;
  return Math.floor(uses);
}

export function seedItemUses(items: InventoryItem[], ids: string[]): Record<string, number> | undefined {
  const uses: Record<string, number> = {};
  for (const id of ids) {
    const item = items.find((entry) => entry.id === id);
    if (!item) continue;
    const remaining = authoredUses(item);
    if (remaining !== undefined) uses[id] = remaining;
  }
  return Object.keys(uses).length > 0 ? uses : undefined;
}

export function assignStartingItems(
  players: PlayerState,
  items: InventoryItem[],
  mode: ItemAssign,
  _rng: () => number,
): PlayerState {
  const pool = startingItems(items);
  if (pool.length === 0 || mode === 'choose') return players;
  const ids = pool.map((item) => item.id);
  const itemUses = seedItemUses(items, ids);
  return {
    ...players,
    players: players.players.map((player: Player) => ({
      ...player,
      inventory: [...ids],
      ...(itemUses ? { itemUses: { ...itemUses } } : {}),
    })),
  };
}

export function itemUsesLeft(
  player: Pick<Player, 'inventory' | 'itemUses'>,
  itemId: string,
  catalog?: InventoryItem[],
): number | undefined {
  if (!player.inventory?.includes(itemId)) return undefined;
  if (player.itemUses && itemId in player.itemUses) return player.itemUses[itemId];
  const item = catalog?.find((entry) => entry.id === itemId);
  return item ? authoredUses(item) : undefined;
}

export function useItem(
  player: Player,
  itemId: string,
  catalog: InventoryItem[] = [],
): { player: Player; usesLeft?: number; destroyed: boolean } {
  if (!player.inventory?.includes(itemId)) {
    return { player, destroyed: false };
  }
  const current = itemUsesLeft(player, itemId, catalog);
  if (current === undefined) {
    return { player, destroyed: false };
  }
  const usesLeft = current - 1;
  if (usesLeft <= 0) {
    const { [itemId]: _drop, ...restUses } = player.itemUses ?? {};
    const inventory = player.inventory.filter((id) => id !== itemId);
    const next: Player = { ...player, inventory };
    if (Object.keys(restUses).length > 0) next.itemUses = restUses;
    else delete next.itemUses;
    return { player: next, usesLeft: 0, destroyed: true };
  }
  return {
    player: {
      ...player,
      itemUses: { ...(player.itemUses ?? {}), [itemId]: usesLeft },
    },
    usesLeft,
    destroyed: false,
  };
}

export function itemNames(items: InventoryItem[], ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => items.find((item) => item.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}
