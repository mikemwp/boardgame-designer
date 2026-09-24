'use client';

import { itemNames } from '@/lib/engine/inventory';
import type { InventoryItem } from '@/lib/engine/types';

export function InventoryBar({
  items,
  inventory,
}: {
  items: InventoryItem[];
  inventory?: string[];
}) {
  const names = itemNames(items, inventory);
  return (
    <p className="text-sm text-slate-300" data-testid="inventory-bar">
      {names.length === 0 ? 'Inventory empty' : `Inventory: ${names.join(', ')}`}
    </p>
  );
}
