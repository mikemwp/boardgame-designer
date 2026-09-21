import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

let resizeObserverCallback: ResizeObserverCallback | null = null;

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
  }
  observe() {}
  disconnect() {}
}

const appMounts = vi.fn();
let lastGraphicsDeviceOptions: Record<string, unknown> | undefined;

vi.mock('@/lib/view/playcanvas-lifecycle', () => ({
  waitForStableReady: vi.fn(async (isReady: () => boolean) => isReady()),
  waitUntilPlayCanvasSlotFree: vi.fn(async () => {}),
  acquirePlayCanvasSlot: vi.fn(() => () => {}),
}));

vi.mock('@/components/board/PlayCanvasDeviceSetup', () => ({
  PlayCanvasDeviceSetup: () => null,
}));

vi.mock('@playcanvas/react', () => ({
  ApplicationWithoutCanvas: ({
    children,
    graphicsDeviceOptions,
  }: {
    children: React.ReactNode;
    graphicsDeviceOptions?: Record<string, unknown>;
  }) => {
    appMounts();
    lastGraphicsDeviceOptions = graphicsDeviceOptions;
    return <div data-testid="pc-application">{children}</div>;
  },
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useApp: () => null,
}));

import { PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS } from '@/lib/view/playcanvas-graphics';
import { PlayCanvasViewport } from '@/components/board/PlayCanvasViewport';

async function fireResize(width: number, height: number) {
  const container = document.querySelector('[data-testid="pc-viewport"]') as HTMLDivElement;
  Object.defineProperty(container, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(container, 'clientHeight', { configurable: true, value: height });
  await act(async () => {
    resizeObserverCallback?.(
      [{ target: container } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

async function flushViewportInit() {
  await act(async () => {
    for (let i = 0; i < 4; i += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    await Promise.resolve();
  });
}

describe('PlayCanvasViewport', () => {
  beforeEach(() => {
    resizeObserverCallback = null;
    appMounts.mockClear();
    lastGraphicsDeviceOptions = undefined;
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts PlayCanvas on first paint when layout settles without a resize', async () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    const container = screen.getByTestId('pc-viewport');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 800 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 600 });

    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await flushViewportInit();
    });

    await waitFor(() => expect(screen.getByTestId('pc-application')).toBeDefined());
    expect(appMounts).toHaveBeenCalledTimes(1);
  });

  it('does not mount PlayCanvas until the canvas has non-zero size', async () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    expect(screen.queryByTestId('pc-application')).toBeNull();
    expect(appMounts).not.toHaveBeenCalled();

    await fireResize(640, 480);
    await flushViewportInit();

    await waitFor(() => expect(screen.getByTestId('pc-application')).toBeDefined());
    expect(appMounts).toHaveBeenCalledTimes(1);
  });

  it('unmounts PlayCanvas when the container collapses to zero size', async () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    await fireResize(640, 480);
    await flushViewportInit();
    await waitFor(() => expect(screen.getByTestId('pc-application')).toBeDefined());

    await fireResize(0, 0);
    await flushViewportInit();

    expect(screen.queryByTestId('pc-application')).toBeNull();
  });

  it('passes no-MSAA graphics device options', async () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    await fireResize(640, 480);
    await flushViewportInit();
    await waitFor(() => expect(screen.getByTestId('pc-application')).toBeDefined());

    expect(lastGraphicsDeviceOptions).toEqual(PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS);
    expect(lastGraphicsDeviceOptions?.antialias).toBe(false);
  });
});
