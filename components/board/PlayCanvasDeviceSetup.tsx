'use client';

import { useApp } from '@playcanvas/react/hooks';
import { useLayoutEffect } from 'react';

/** Belt-and-suspenders: keep the back buffer on single-sample rendering. */
export function PlayCanvasDeviceSetup() {
  const app = useApp();

  useLayoutEffect(() => {
    if (!app) return;
    app.graphicsDevice.backBufferAntialias = false;
  }, [app]);

  return null;
}
