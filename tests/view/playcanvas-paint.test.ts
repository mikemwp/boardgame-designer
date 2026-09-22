import { describe, it, expect, vi } from 'vitest';
import { paintPlayCanvasViewport } from '@/lib/view/playcanvas-paint';

describe('paintPlayCanvasViewport', () => {
  it('does not paint a zero-size canvas', () => {
    const app = { resizeCanvas: vi.fn(), renderNextFrame: false };
    expect(paintPlayCanvasViewport(app, { clientWidth: 416, clientHeight: 0 })).toBe(false);
    expect(app.resizeCanvas).not.toHaveBeenCalled();
    expect(app.renderNextFrame).toBe(false);
  });

  it('resizes and requests a frame so the first paint is not a blank buffer', () => {
    const app = { resizeCanvas: vi.fn(), renderNextFrame: false };
    expect(paintPlayCanvasViewport(app, { clientWidth: 416, clientHeight: 460 })).toBe(true);
    expect(app.resizeCanvas).toHaveBeenCalledWith(416, 460);
    expect(app.renderNextFrame).toBe(true);
  });
});
