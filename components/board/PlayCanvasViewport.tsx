'use client';

import { ApplicationWithoutCanvas } from '@playcanvas/react';
import { useApp } from '@playcanvas/react/hooks';
import { FILLMODE_NONE, RESOLUTION_FIXED } from 'playcanvas';
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { PlayCanvasDeviceSetup } from '@/components/board/PlayCanvasDeviceSetup';
import { PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS } from '@/lib/view/playcanvas-graphics';
import {
  acquirePlayCanvasSlot,
  waitFrames,
  waitForStableReady,
  waitUntilPlayCanvasSlotFree,
} from '@/lib/view/playcanvas-lifecycle';

function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

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
  slotId: slotIdProp,
}: {
  children: ReactNode;
  usePhysics?: boolean;
  className?: string;
  slotId?: string;
}) {
  const generatedSlotId = useId();
  const slotId = slotIdProp ?? generatedSlotId;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const hadSizeRef = useRef(false);
  const [sized, setSized] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let frameId = 0;

    const applySize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        hadSizeRef.current = true;
        setSized(true);
        return;
      }
      if (hadSizeRef.current) {
        setSized(false);
      }
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        applySize();
      });
    };

    applySize();
    scheduleMeasure();

    const observer = new ResizeObserver(() => {
      scheduleMeasure();
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (!sized) {
      setAppReady(false);
      return;
    }

    let cancelled = false;

    const hasDimensions = () => {
      const container = containerRef.current;
      return Boolean(
        container && container.clientWidth > 0 && container.clientHeight > 0 && !cancelled,
      );
    };

    (async () => {
      await nextFrame();
      if (!hasDimensions()) return;

      const stable = await waitForStableReady(hasDimensions, 1);
      if (!stable || cancelled) return;

      await waitUntilPlayCanvasSlotFree(2);
      if (!hasDimensions()) return;

      for (let attempt = 0; attempt < 40 && !cancelled; attempt += 1) {
        const release = acquirePlayCanvasSlot(slotId);
        if (release) {
          releaseSlotRef.current = release;
          setAppReady(true);
          return;
        }
        await waitUntilPlayCanvasSlotFree(1);
        await waitFrames(1);
        if (!hasDimensions()) return;
      }
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
