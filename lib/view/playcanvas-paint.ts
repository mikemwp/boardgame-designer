export type PaintableApp = {
  renderNextFrame: boolean;
  graphicsDevice: {
    resizeCanvas: (width: number, height: number) => void;
  };
};

export function paintPlayCanvasViewport(
  app: PaintableApp,
  box: { clientWidth: number; clientHeight: number },
): boolean {
  const width = box.clientWidth;
  const height = box.clientHeight;
  if (width <= 0 || height <= 0) return false;
  // RESOLUTION_FIXED + app.resizeCanvas only sets CSS. Resize the GL buffer.
  app.graphicsDevice.resizeCanvas(width, height);
  app.renderNextFrame = true;
  return true;
}
