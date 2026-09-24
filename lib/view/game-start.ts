import { isGameStartEmpty } from '@/lib/engine/audio';
import type { GameStart, SplashScreen } from '@/lib/engine/types';

export type StartPhase = 'skip' | 'splash' | 'menu' | 'play';

export function isSplashRenderable(splash: SplashScreen): boolean {
  return Boolean(splash.image || (splash.caption ?? '').trim());
}

export function firstRenderableSplashIndex(start: GameStart): number {
  return start.splashes.findIndex(isSplashRenderable);
}

export function initialStartPhase(start: GameStart | undefined): StartPhase {
  if (isGameStartEmpty(start) || !start) return 'skip';
  if (start.splashes.some(isSplashRenderable)) return 'splash';
  return 'menu';
}

export function afterSplashes(start: GameStart): 'menu' | 'play' {
  if (start.menu.items.length > 0 || start.audio) return 'menu';
  return 'play';
}

export function nextSplashIndex(
  start: GameStart,
  index: number,
  mode: 'timeout' | 'skip',
): number | 'menu' | 'play' {
  const remaining = start.splashes.slice(index + 1);
  if (mode === 'skip' && remaining.every((splash) => splash.skippable !== false)) {
    return afterSplashes(start);
  }
  for (let i = index + 1; i < start.splashes.length; i += 1) {
    if (isSplashRenderable(start.splashes[i]!)) return i;
  }
  return afterSplashes(start);
}

export function splashDurationMs(splash: SplashScreen | undefined): number {
  if (!splash) return 4000;
  if (splash.durationMs === 0) return 0;
  return splash.durationMs ?? 4000;
}
