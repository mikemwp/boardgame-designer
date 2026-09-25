'use client';

import { Button } from '@/components/ui/button';
import { itemNames, itemUsesLeft } from '@/lib/engine/inventory';
import type { InventoryItem, Player } from '@/lib/engine/types';

export function InventoryBar({
  items,
  inventory,
  player,
  onUse,
}: {
  items: InventoryItem[];
  inventory?: string[];
  player?: Pick<Player, 'inventory' | 'itemUses'>;
  onUse?: (itemId: string) => void;
}) {
  const names = itemNames(items, inventory);
  return (
    <div className="flex flex-col gap-1" data-testid="inventory-bar">
      <p className="text-sm text-slate-300">
        {names.length === 0 ? 'Inventory empty' : `Inventory: ${names.join(', ')}`}
      </p>
      {player && inventory && inventory.length > 0
        ? inventory.map((itemId) => {
            const item = items.find((entry) => entry.id === itemId);
            if (!item) return null;
            const left = itemUsesLeft(player, itemId, items);
            if (left === undefined) return null;
            return (
              <div key={itemId} className="flex items-center gap-2 text-sm text-slate-200">
                <span>
                  {item.name} ({left} left)
                </span>
                {onUse ? (
                  <Button type="button" variant="outline" onClick={() => onUse(itemId)}>
                    Use
                  </Button>
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
}
