import type { InventoryItem, ItemAssign, Player } from './types';
import type { PlayerState } from './players';

export function startingItems(list: InventoryItem[]): InventoryItem[] {
  return list.filter((item) => item.starting);
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
  return {
    ...players,
    players: players.players.map((player: Player) => ({ ...player, inventory: [...ids] })),
  };
}

export function itemNames(items: InventoryItem[], ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => items.find((item) => item.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}
