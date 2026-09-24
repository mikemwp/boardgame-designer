import { describe, it, expect } from 'vitest';
import { emptyGameStart } from '@/lib/engine/audio';
import {
  addMenuItem,
  addSplash,
  moveMenuItem,
  moveSplash,
  nextMenuItemId,
  nextSplashId,
  removeMenuItem,
  removeSplash,
  setGameStartAudio,
  updateMenuItem,
  updateSplash,
} from '@/lib/designer/game-start';

const clip = { id: 'g1', name: 'intro.mp3', source: 'url' as const, src: 'https://ex/intro.mp3' };

describe('game-start mutations', () => {
  it('sets and clears game-start audio', () => {
    const withAudio = setGameStartAudio(emptyGameStart(), clip);
    expect(withAudio.audio).toEqual(clip);
    expect(setGameStartAudio(withAudio, undefined).audio).toBeUndefined();
  });

  it('adds two splashes and reorders them', () => {
    let start = emptyGameStart();
    start = addSplash(start, { id: nextSplashId(start), caption: 'One' });
    start = addSplash(start, { id: nextSplashId(start), caption: 'Two' });
    expect(start.splashes.map((s) => s.caption)).toEqual(['One', 'Two']);
    start = moveSplash(start, start.splashes[1]!.id, -1);
    expect(start.splashes.map((s) => s.caption)).toEqual(['Two', 'One']);
    start = updateSplash(start, start.splashes[0]!.id, { caption: 'Hello' });
    expect(start.splashes[0]?.caption).toBe('Hello');
    start = removeSplash(start, start.splashes[0]!.id);
    expect(start.splashes).toHaveLength(1);
  });

  it('adds Play and Continue menu items and reorders them', () => {
    let start = emptyGameStart();
    start = addMenuItem(start, { id: nextMenuItemId(start), label: 'Play', action: 'play' });
    start = addMenuItem(start, { id: nextMenuItemId(start), label: 'Continue', action: 'continue' });
    expect(start.menu.items.map((i) => i.action)).toEqual(['play', 'continue']);
    start = moveMenuItem(start, start.menu.items[1]!.id, -1);
    expect(start.menu.items.map((i) => i.label)).toEqual(['Continue', 'Play']);
    expect(updateMenuItem(start, start.menu.items[0]!.id, { label: '  ' })).toEqual(start);
    start = updateMenuItem(start, start.menu.items[0]!.id, { label: 'Resume' });
    expect(start.menu.items[0]?.label).toBe('Resume');
    start = removeMenuItem(start, start.menu.items[0]!.id);
    expect(start.menu.items).toHaveLength(1);
  });

  it('ignores empty or duplicate ids', () => {
    const start = addSplash(emptyGameStart(), { id: 'splash-1', caption: 'A' });
    expect(addSplash(start, { id: '', caption: 'Nope' })).toEqual(start);
    expect(addSplash(start, { id: 'splash-1', caption: 'Dup' })).toEqual(start);
    expect(addMenuItem(start, { id: '', label: 'Play', action: 'play' })).toEqual(start);
  });
});
