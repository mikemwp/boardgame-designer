'use client';

import { useEffect, useRef } from 'react';
import { Wheel } from 'spin-wheel';
import { spinnerTemplateOf } from '@/lib/designer/spinner-templates';
import type { SpinnerDef } from '@/lib/engine/types';
import { spinnerSegmentIndex } from '@/lib/view/hud-spinner';
import {
  spinToItemArgs,
  wheelItemsFromMax,
  wheelItemsFromSpinner,
  wheelProps,
} from '@/lib/view/spin-wheel-adapter';

const TEMPLATE_BORDER: Record<string, string> = {
  classic: '#94a3b8',
  wood: '#b45309',
  neon: '#22d3ee',
  compass: '#f8fafc',
};

export function HudSpinner({
  value,
  max,
  spinning,
  rollId,
  spinner,
  isInteractive = false,
  onTick,
  onRest,
}: {
  value: number;
  max: 6 | 12;
  spinning: boolean;
  rollId: number;
  spinner?: SpinnerDef;
  isInteractive?: boolean;
  onTick?: (index: number) => void;
  onRest?: (index: number) => void;
}) {
  const template = spinnerTemplateOf(spinner?.template);
  const segmentIndex = spinner ? spinnerSegmentIndex(spinner, value) : value - 1;
  const label = spinner
    ? `Spinner showing ${spinner.segments[segmentIndex]?.label ?? value}`
    : `Spinner showing ${value} of ${max}`;
  const canvasRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<Wheel | null>(null);
  const tickRef = useRef(onTick);
  const restRef = useRef(onRest);
  tickRef.current = onTick;
  restRef.current = onRest;

  const itemsKey = JSON.stringify(spinner ? wheelItemsFromSpinner(spinner) : wheelItemsFromMax(max));
  const imageSrc = spinner?.image?.src;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const nextItems = spinner ? wheelItemsFromSpinner(spinner) : wheelItemsFromMax(max);
    const props = {
      ...wheelProps({ items: nextItems, isInteractive }),
      borderColor: TEMPLATE_BORDER[template.id] ?? TEMPLATE_BORDER.classic,
      onCurrentIndexChange: (event: { currentIndex: number }) => {
        tickRef.current?.(event.currentIndex);
      },
      onRest: (event: { currentIndex: number }) => {
        restRef.current?.(event.currentIndex);
      },
    };
    const wheel = new Wheel(el, props);
    wheelRef.current = wheel;
    if (imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        wheel.image = img;
      };
      img.src = imageSrc;
    }
    return () => {
      wheel.remove();
      if (wheelRef.current === wheel) wheelRef.current = null;
    };
  }, [itemsKey, isInteractive, imageSrc, template.id, max, spinner]);

  useEffect(() => {
    if (!spinning) return;
    const wheel = wheelRef.current;
    if (!wheel) return;
    const args = spinToItemArgs(spinner, value, max);
    wheel.spinToItem(
      args.itemIndex,
      args.duration,
      args.spinToCenter,
      args.numberOfRevolutions,
      args.direction,
      args.easingFunction,
    );
  }, [spinning, rollId, value, max, spinner]);

  return (
    <div
      className={`hud-spinner hud-spinner--${template.id}`}
      data-testid="hud-spinner"
      data-template={template.id}
      data-roll-id={rollId}
      data-interactive={isInteractive ? 'true' : 'false'}
      role="img"
      aria-label={label}
    >
      <div className="hud-spinner-pointer" data-testid="spinner-pointer" />
      <div ref={canvasRef} className="hud-spinner-canvas" data-testid="hud-spinner-canvas" />
    </div>
  );
}
