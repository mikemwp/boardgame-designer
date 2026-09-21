import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

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

import { PlayCanvasViewport } from '@/components/board/PlayCanvasViewport';

function fireResize(width: number, height: number) {
  const container = document.querySelector('[data-testid="pc-viewport"]') as HTMLDivElement;
  Object.defineProperty(container, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(container, 'clientHeight', { configurable: true, value: height });
  act(() => {
    resizeObserverCallback?.(
      [{ target: container } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
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

  it('does not mount PlayCanvas until the canvas has non-zero size', () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    expect(screen.queryByTestId('pc-application')).toBeNull();
    expect(appMounts).not.toHaveBeenCalled();

    fireResize(640, 480);

    expect(screen.getByTestId('pc-application')).toBeDefined();
    expect(appMounts).toHaveBeenCalledTimes(1);
  });

  it('unmounts PlayCanvas when the container collapses to zero size', () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    fireResize(640, 480);
    expect(screen.getByTestId('pc-application')).toBeDefined();

    fireResize(0, 0);

    expect(screen.queryByTestId('pc-application')).toBeNull();
  });

  it('disables antialias to avoid MSAA framebuffer failures', () => {
    render(
      <PlayCanvasViewport>
        <span>scene</span>
      </PlayCanvasViewport>,
    );

    fireResize(640, 480);

    expect(lastGraphicsDeviceOptions).toEqual({ alpha: false, antialias: false });
  });
});
