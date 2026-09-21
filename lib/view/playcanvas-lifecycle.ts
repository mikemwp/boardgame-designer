function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export async function waitFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await nextFrame();
  }
}

let holderId: string | null = null;
let drainPromise: Promise<void> | null = null;

export function getPlayCanvasSlotHolder(): string | null {
  return holderId;
}

export function isPlayCanvasSlotHeld(): boolean {
  return holderId !== null;
}

export function acquirePlayCanvasSlot(id: string): (() => void) | null {
  if (holderId && holderId !== id) return null;
  holderId = id;
  return () => releasePlayCanvasSlot(id);
}

export function releasePlayCanvasSlot(id: string): void {
  if (holderId !== id) return;
  holderId = null;
  drainPromise = waitFrames(3).then(() => {
    drainPromise = null;
  });
}

export async function waitUntilPlayCanvasSlotFree(extraFrames = 2): Promise<void> {
  if (drainPromise) await drainPromise;
  while (holderId) {
    await waitFrames(1);
  }
  await waitFrames(extraFrames);
}

/** True once `ready` stays true across `frames` animation frames (Strict Mode guard). */
export async function waitForStableReady(
  isReady: () => boolean,
  frames = 2,
): Promise<boolean> {
  for (let i = 0; i < frames; i++) {
    await waitFrames(1);
    if (!isReady()) return false;
  }
  return isReady();
}
