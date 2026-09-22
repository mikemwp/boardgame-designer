export type PaintableApp = {
  resizeCanvas: (width: number, height: number) => void;
  renderNextFrame: boolean;
};

export function paintPlayCanvasViewport(
  app: PaintableApp,
  box: { clientWidth: number; clientHeight: number },
): boolean {
  const width = box.clientWidth;
  const height = box.clientHeight;
  if (width <= 0 || height <= 0) return false;
  app.resizeCanvas(width, height);
  app.renderNextFrame = true;
  return true;
}
