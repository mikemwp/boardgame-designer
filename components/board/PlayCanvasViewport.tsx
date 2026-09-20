'use client';

import { ApplicationWithoutCanvas } from '@playcanvas/react';
import { useApp } from '@playcanvas/react/hooks';
import { FILLMODE_NONE, RESOLUTION_FIXED } from 'playcanvas';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

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
        setReady(true);
      }
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Interactive 3D Scene" />
      {ready && (
        <ApplicationWithoutCanvas
          canvasRef={canvasRef}
          usePhysics={usePhysics}
          fillMode={FILLMODE_NONE}
          resolutionMode={RESOLUTION_FIXED}
          graphicsDeviceOptions={{ alpha: false, antialias: true }}
        >
          <CanvasResizeSync />
          {children}
        </ApplicationWithoutCanvas>
      )}
    </div>
  );
}
