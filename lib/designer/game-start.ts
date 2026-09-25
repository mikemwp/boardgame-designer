import type { AudioRef, GameStart, ImageRef, SplashScreen, StartMenuItem } from '@/lib/engine/types';

function nextNumberedId(prefix: string, used: Set<string>): string {
  let n = 1;
  while (used.has(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

export function nextSplashId(start: GameStart): string {
  return nextNumberedId('splash', new Set(start.splashes.map((s) => s.id)));
}

export function nextMenuItemId(start: GameStart): string {
  return nextNumberedId('menu', new Set(start.menu.items.map((i) => i.id)));
}

export function setStartBackground(start: GameStart, background: ImageRef | undefined): GameStart {
  if (!background) {
    const next = { ...start };
    delete next.background;
    return next;
  }
  return { ...start, background };
}

export function setStayThroughout(start: GameStart, stayThroughout: boolean): GameStart {
  return { ...start, stayThroughout };
}

export function setGameStartAudio(start: GameStart, audio: AudioRef | undefined): GameStart {
  if (!audio) {
    const next = { ...start };
    delete next.audio;
    return next;
  }
  return { ...start, audio };
}

export function addSplash(start: GameStart, splash: SplashScreen): GameStart {
  const id = splash.id.trim();
  if (!id || start.splashes.some((s) => s.id === id)) return start;
  return { ...start, splashes: [...start.splashes, { ...splash, id }] };
}

export function updateSplash(start: GameStart, id: string, patch: Partial<SplashScreen>): GameStart {
  return {
    ...start,
    splashes: start.splashes.map((splash) => (splash.id === id ? { ...splash, ...patch, id } : splash)),
  };
}

export function removeSplash(start: GameStart, id: string): GameStart {
  return { ...start, splashes: start.splashes.filter((splash) => splash.id !== id) };
}

function moveById<T extends { id: string }>(items: T[], id: string, dir: -1 | 1): T[] {
  const index = items.findIndex((item) => item.id === id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item!);
  return copy;
}

export function moveSplash(start: GameStart, id: string, dir: -1 | 1): GameStart {
  return { ...start, splashes: moveById(start.splashes, id, dir) };
}

export function addMenuItem(start: GameStart, item: StartMenuItem): GameStart {
  const id = item.id.trim();
  if (!id || start.menu.items.some((existing) => existing.id === id)) return start;
  return { ...start, menu: { items: [...start.menu.items, { ...item, id }] } };
}

export function updateMenuItem(
  start: GameStart,
  id: string,
  patch: Partial<StartMenuItem>,
): GameStart {
  if (patch.label !== undefined && patch.label.trim().length === 0) return start;
  return {
    ...start,
    menu: {
      items: start.menu.items.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch, id };
        if (patch.label !== undefined) next.label = patch.label.trim();
        return next;
      }),
    },
  };
}

export function removeMenuItem(start: GameStart, id: string): GameStart {
  return { ...start, menu: { items: start.menu.items.filter((item) => item.id !== id) } };
}

export function moveMenuItem(start: GameStart, id: string, dir: -1 | 1): GameStart {
  return { ...start, menu: { items: moveById(start.menu.items, id, dir) } };
}
