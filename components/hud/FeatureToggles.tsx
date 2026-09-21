'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ActionMode, GameConfig } from '@/lib/engine/types';

const ACTION_MODES: ActionMode[] = ['both', 'positive', 'pass', 'neither'];

export function FeatureToggles({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (patch: Partial<GameConfig>) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-200">Features</h2>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="dice-toggle">3D dice</Label>
        <Switch
          id="dice-toggle"
          checked={config.diceEnabled}
          onCheckedChange={(checked) => onChange({ diceEnabled: checked })}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="two-dice-toggle">2 dice (1–12)</Label>
        <Switch
          id="two-dice-toggle"
          checked={config.diceCount === 2}
          onCheckedChange={(checked) =>
            onChange({
              diceCount: checked ? 2 : 1,
              diceSides: checked ? 12 : 6,
            })
          }
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="hold-toggle">Per-floor hold</Label>
        <Switch
          id="hold-toggle"
          checked={config.holdEnabled}
          onCheckedChange={(checked) => onChange({ holdEnabled: checked })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="action-mode">Card actions</Label>
        <select
          id="action-mode"
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          value={config.actionMode}
          onChange={(e) => onChange({ actionMode: e.target.value as ActionMode })}
        >
          {ACTION_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
