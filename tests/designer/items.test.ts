import { describe, it, expect } from 'vitest';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import {
  assignStartingItems,
  createItem,
  deleteItem,
  nextItemId,
  startingItems,
  updateItem,
} from '@/lib/designer/items';
import { useItem } from '@/lib/engine/inventory';

describe('item catalog', () => {
  it('creates, updates, and deletes named items', () => {
    expect(nextItemId([])).toBe('item-1');
    const created = createItem([], 'item-1');
    expect(created[0]).toMatchObject({ id: 'item-1', name: 'Item 1', starting: false });
    const updated = updateItem(created, 'item-1', { name: 'Lock pick', starting: true });
    expect(updated[0]).toMatchObject({ name: 'Lock pick', starting: true });
    expect(startingItems(updated)).toHaveLength(1);
    expect(deleteItem(updated, 'item-1')).toEqual([]);
  });

  it('stores description, usage notes, and uses remaining', () => {
    const created = createItem([], 'item-1');
    const detailed = updateItem(created, 'item-1', {
      name: 'Lock pick',
      description: 'Opens a lock',
      usageNotes: 'Once per door',
      usesRemaining: 2,
    });
    expect(detailed[0]).toMatchObject({
      name: 'Lock pick',
      description: 'Opens a lock',
      usageNotes: 'Once per door',
      usesRemaining: 2,
    });
  });

  it('tracks remaining uses and destroys the item at 0', () => {
    const items = updateItem(createItem([], 'item-1'), 'item-1', {
      name: 'Lock pick',
      starting: true,
      usesRemaining: 2,
    });
    const players = addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'A',
      token: { floorId: 'ground', cellId: 'c0' },
    });
    const seeded = assignStartingItems(players, items, 'random', () => 0);
    expect(seeded.players[0]?.inventory).toEqual(['item-1']);
    expect(seeded.players[0]?.itemUses).toEqual({ 'item-1': 2 });
    const once = useItem(seeded.players[0]!, 'item-1', items);
    expect(once.usesLeft).toBe(1);
    expect(once.destroyed).toBe(false);
    const twice = useItem(once.player, 'item-1', items);
    expect(twice.destroyed).toBe(true);
    expect(twice.player.inventory).toEqual([]);
  });

  it('assigns every starting item to each player when random', () => {
    const items = updateItem(createItem([], 'item-1'), 'item-1', { name: 'Lock pick', starting: true });
    const players = addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'A',
      token: { floorId: 'ground', cellId: 'c0' },
    });
    const seeded = assignStartingItems(players, items, 'random', () => 0);
    expect(seeded.players[0]?.inventory).toEqual(['item-1']);
    expect(assignStartingItems(players, items, 'choose', () => 0).players[0]?.inventory).toBeUndefined();
  });
});
