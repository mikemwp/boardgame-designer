'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/lib/engine/types';

export function ItemSetup({
  items,
  onConfirm,
}: {
  items: InventoryItem[];
  onConfirm: (itemIds: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="item-setup">
      <p className="text-sm font-medium text-slate-100">Choose starting items</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No starting items in this draft.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  aria-label={`Take ${item.name}`}
                  checked={picked.includes(item.id)}
                  onChange={(e) => {
                    setPicked((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    );
                  }}
                />
                {item.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" onClick={() => onConfirm(picked)}>
        Confirm items
      </Button>
    </div>
  );
}
