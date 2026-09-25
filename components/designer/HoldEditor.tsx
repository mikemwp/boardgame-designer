'use client';

import { MediaField } from '@/components/designer/AudioField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Floor, ImageRef } from '@/lib/engine/types';
import type { MediaStore } from '@/lib/library/media-store';

export function HoldEditor({
  floor,
  packIds,
  onChange,
  gameId,
  media,
  onBackgroundChange,
}: {
  floor: Floor;
  packIds: string[];
  onChange: (patch: { holdEnabled?: boolean; holdQuotas?: Record<string, number> }) => void;
  gameId?: string;
  media?: MediaStore;
  onBackgroundChange?: (background: ImageRef | undefined) => void;
}) {
  const holdOn = Boolean(floor.holdEnabled);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="hold-editor">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="level-hold">Level hold</Label>
        <Switch
          id="level-hold"
          nativeButton
          aria-label="Level hold"
          render={<button type="button" />}
          checked={holdOn}
          onCheckedChange={(checked) => onChange({ holdEnabled: checked })}
        />
      </div>
      {holdOn && packIds.length === 0 ? (
        <p className="text-sm text-slate-400">Create a pack in Packs to set reveal quotas.</p>
      ) : null}
      {onBackgroundChange && gameId && media ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-100">Level background</p>
          <MediaField
            kind="image"
            value={floor.background}
            gameId={gameId}
            media={media}
            idPrefix={`level-bg-${floor.id}`}
            label="Level background"
            onChange={(next) => onBackgroundChange(next as ImageRef | undefined)}
          />
          {!floor.background ? (
            <p className="text-sm text-slate-400">Uses the Start background.</p>
          ) : null}
        </div>
      ) : null}
      {holdOn
        ? packIds.map((packId) => (
            <div key={packId} className="flex items-center justify-between gap-4">
              <Label htmlFor={`quota-${packId}`}>{packId}</Label>
              <Input
                id={`quota-${packId}`}
                type="number"
                aria-label={`Quota for ${packId}`}
                value={floor.holdQuotas?.[packId] ?? ''}
                onChange={(event) =>
                  onChange({
                    holdQuotas: { ...floor.holdQuotas, [packId]: Number(event.target.value) },
                  })
                }
              />
            </div>
          ))
        : null}
    </div>
  );
}
