'use client';

import { formatPassesLeft } from '@/lib/engine/passes';

export function PassStatus({
  passesEnabled,
  passesLeftByPack,
}: {
  passesEnabled: boolean;
  passesLeftByPack: Record<string, number>;
}) {
  if (!passesEnabled || Object.keys(passesLeftByPack).length === 0) return null;
  return (
    <p className="text-sm text-slate-300">
      Passes left: {formatPassesLeft(passesLeftByPack)}
    </p>
  );
}
