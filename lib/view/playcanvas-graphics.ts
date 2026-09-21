/** WebGL context options: no MSAA / multisampling on the back buffer. */
export const PLAYCANVAS_GRAPHICS_DEVICE_OPTIONS = {
  alpha: false,
  antialias: false,
  depth: true,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
} as const;
