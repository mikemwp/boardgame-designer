// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  acquirePlayCanvasSlot,
  getPlayCanvasSlotHolder,
  isPlayCanvasSlotHeld,
  releasePlayCanvasSlot,
  waitForStableReady,
} from '@/lib/view/playcanvas-lifecycle';

describe('playcanvas-lifecycle', () => {
  beforeEach(() => {
    releasePlayCanvasSlot('a');
    releasePlayCanvasSlot('b');
  });

  it('allows only one viewport slot at a time', () => {
    const releaseA = acquirePlayCanvasSlot('a');
    expect(releaseA).not.toBeNull();
    expect(isPlayCanvasSlotHeld()).toBe(true);
    expect(getPlayCanvasSlotHolder()).toBe('a');
    expect(acquirePlayCanvasSlot('b')).toBeNull();

    releaseA?.();
    expect(isPlayCanvasSlotHeld()).toBe(false);

    const releaseB = acquirePlayCanvasSlot('b');
    expect(releaseB).not.toBeNull();
    expect(getPlayCanvasSlotHolder()).toBe('b');
    releaseB?.();
  });

  it('waitForStableReady returns false when readiness drops during settle frames', async () => {
    let ready = true;
    const stable = await waitForStableReady(() => ready, 2);
    expect(stable).toBe(true);

    ready = false;
    const unstable = await waitForStableReady(() => ready, 2);
    expect(unstable).toBe(false);
  });
});
