import { describe, it, expect } from 'vitest';
import {
  wheelItemsFromSpinner,
  wheelItemsFromMax,
  wheelProps,
  spinToItemArgs,
  easingFromCss,
} from '@/lib/view/spin-wheel-adapter';
import { createSpinner, updateSpinner } from '@/lib/designer/spinners';

describe('spin-wheel adapter', () => {
  it('maps equal and percent segments to weighted items', () => {
    let list = createSpinner([], 'spinner-1');
    expect(wheelItemsFromSpinner(list[0]!)).toHaveLength(2);
    expect(wheelItemsFromSpinner(list[0]!)[0]).toMatchObject({
      label: 'Segment 1',
      weight: 1,
    });
    list = updateSpinner(list, 'spinner-1', {
      split: 'percent',
      segments: [
        { id: 'a', label: 'Me', percent: 10 },
        { id: 'b', label: 'Partner', percent: 90 },
      ],
    });
    expect(wheelItemsFromSpinner(list[0]!).map((item) => item.weight)).toEqual([10, 90]);
  });

  it('builds a numeric 1–12 wheel and engine-first spinToItem args', () => {
    expect(wheelItemsFromMax(12)).toHaveLength(12);
    expect(wheelItemsFromMax(12)[6]?.label).toBe('7');
    const numeric = spinToItemArgs(undefined, 7, 12);
    expect(numeric.itemIndex).toBe(6);
    expect(numeric.duration).toBe(1400);
    expect(numeric.spinToCenter).toBe(true);
    expect(numeric.numberOfRevolutions).toBe(4);
    const catalog = createSpinner([], 'spinner-1')[0]!;
    catalog.segments[1]!.label = '2';
    expect(spinToItemArgs(catalog, 2, 6).itemIndex).toBe(1);
    expect(spinToItemArgs(catalog, 2, 6).duration).toBe(1400);
  });

  it('forces isInteractive off unless the caller turns it on', () => {
    const off = wheelProps({ items: wheelItemsFromMax(6), isInteractive: false });
    expect(off.isInteractive).toBe(false);
    expect(off.pointerAngle).toBe(0);
    expect(wheelProps({ items: wheelItemsFromMax(6), isInteractive: true }).isInteractive).toBe(true);
  });

  it('maps template cubic-bezier to a unit easing', () => {
    const ease = easingFromCss('cubic-bezier(0.12, 0.7, 0.2, 1)');
    expect(ease(0)).toBeCloseTo(0);
    expect(ease(1)).toBeCloseTo(1);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });
});
