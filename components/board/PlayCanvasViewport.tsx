'use client';

import { ApplicationWithoutCanvas } from '@playcanvas/react';
import { useApp } from '@playcanvas/react/hooks';
import { FILLMODE_NONE, RESOLUTION_FIXED } from 'playcanvas';
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { PlayCanvasDeviceSetup } from '@/components/board/PlayCanvasDeviceSetup';
import { PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS } from '@/lib/view/playcanvas-graphics';
import {
  acquirePlayCanvasSlot,
  waitForStableReady,
  waitUntilPlayCanvasSlotFree,
} from '@/lib/view/playcanvas-lifecycle';

function CanvasResizeSync() {
  const app = useApp();

  useLayoutEffect(() => {
    if (!app) return;

    const canvas = app.graphicsDevice.canvas as HTMLCanvasElement;
    const container = canvas.parentElement;
    if (!container) return;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        app.resizeCanvas(w, h);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [app]);

  return null;
}

export function PlayCanvasViewport({
  children,
  usePhysics = false,
  className = 'relative h-full w-full',
}: {
  children: ReactNode;
  usePhysics?: boolean;
  className?: string;
}) {
  const slotId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const [sized, setSized] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        setSized(true);
      } else {
        setSized(false);
      }
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!sized) {
      setAppReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const stable = await waitForStableReady(() => !cancelled && sized, 2);
      if (!stable || cancelled) return;

      await waitUntilPlayCanvasSlotFree(2);
      if (cancelled || !sized) return;

      const release = acquirePlayCanvasSlot(slotId);
      if (!release || cancelled) return;

      releaseSlotRef.current = release;
      setAppReady(true);
    })();

    return () => {
      cancelled = true;
      setAppReady(false);
      releaseSlotRef.current?.();
      releaseSlotRef.current = null;
    };
  }, [sized, slotId]);

  return (
    <div ref={containerRef} className={className} data-testid="pc-viewport">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Interactive 3D Scene" />
      {appReady && (
        <ApplicationWithoutCanvas
          canvasRef={canvasRef}
          usePhysics={usePhysics}
          fillMode={FILLMODE_NONE}
          resolutionMode={RESOLUTION_FIXED}
          graphicsDeviceOptions={PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS}
        >
          <PlayCanvasDeviceSetup />
          <CanvasResizeSync />
          {children}
        </ApplicationWithoutCanvas>
      )}
    </div>
  );
}
