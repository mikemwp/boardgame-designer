'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HudSpinner } from '@/components/hud/HudSpinner';
import { sampleSegment } from '@/lib/designer/spinners';
import { segmentMoveValue } from '@/lib/engine/spinner';
import type { SpinnerDef } from '@/lib/engine/types';

export function SpinnerPreview({
  spinner,
  isInteractive = true,
}: {
  spinner: SpinnerDef;
  isInteractive?: boolean;
}) {
  const [value, setValue] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [rollId, setRollId] = useState(0);

  const spinFromEngine = () => {
    const segment = sampleSegment(spinner, Math.random);
    const index = Math.max(
      0,
      spinner.segments.findIndex((entry) => entry.id === segment?.id),
    );
    const picked = spinner.segments[index] ?? spinner.segments[0];
    setValue(picked ? segmentMoveValue(picked, index) : 1);
    setSpinning(true);
    setRollId((id) => id + 1);
  };

  return (
    <div
      className="flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4"
      data-testid="spinner-preview"
    >
      <HudSpinner
        value={value}
        max={6}
        spinning={spinning}
        rollId={rollId}
        spinner={spinner}
        isInteractive={isInteractive}
        onRest={() => setSpinning(false)}
      />
      <Button type="button" onClick={spinFromEngine}>
        Spin
      </Button>
    </div>
  );
}
