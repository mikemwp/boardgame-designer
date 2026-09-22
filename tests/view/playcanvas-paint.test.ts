import { describe, it, expect, vi } from 'vitest';
import { paintPlayCanvasViewport } from '@/lib/view/playcanvas-paint';

function makeApp() {
  return {
    resizeCanvas: vi.fn(),
    renderNextFrame: false,
    graphicsDevice: { resizeCanvas: vi.fn() },
  };
}

describe('paintPlayCanvasViewport', () => {
  it('does not paint a zero-size canvas', () => {
    const app = makeApp();
    expect(paintPlayCanvasViewport(app, { clientWidth: 416, clientHeight: 0 })).toBe(false);
    expect(app.graphicsDevice.resizeCanvas).not.toHaveBeenCalled();
    expect(app.renderNextFrame).toBe(false);
  });

  it('resizes the WebGL buffer so RESOLUTION_FIXED cannot leave a 0x0 canvas', () => {
    const app = makeApp();
    expect(paintPlayCanvasViewport(app, { clientWidth: 416, clientHeight: 460 })).toBe(true);
    expect(app.graphicsDevice.resizeCanvas).toHaveBeenCalledWith(416, 460);
    expect(app.renderNextFrame).toBe(true);
  });
});
