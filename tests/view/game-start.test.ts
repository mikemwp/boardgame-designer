import { describe, it, expect } from 'vitest';
import type { GameStart } from '@/lib/engine/types';
import { initialStartPhase, nextSplashIndex } from '@/lib/view/game-start';

const clip = { id: 'g', name: 'intro.mp3', source: 'url' as const, src: 'https://ex/intro.mp3' };

describe('initialStartPhase', () => {
  it('skips an empty start', () => {
    expect(initialStartPhase(undefined)).toBe('skip');
    expect(initialStartPhase({ splashes: [], menu: { items: [] } })).toBe('skip');
  });

  it('opens on splash when a splash exists', () => {
    const start: GameStart = {
      splashes: [{ id: 'splash-1', caption: 'Hello' }],
      menu: { items: [] },
    };
    expect(initialStartPhase(start)).toBe('splash');
  });

  it('opens on menu when only menu items exist', () => {
    const start: GameStart = {
      splashes: [],
      menu: { items: [{ id: 'm1', label: 'Play', action: 'play' }] },
    };
    expect(initialStartPhase(start)).toBe('menu');
  });

  it('does not skip audio-only start', () => {
    expect(initialStartPhase({ audio: clip, splashes: [], menu: { items: [] } })).toBe('menu');
  });
});

describe('nextSplashIndex', () => {
  it('advances to the next valid splash then the menu', () => {
    const start: GameStart = {
      splashes: [
        { id: 's1', caption: 'One', skippable: true },
        { id: 's2', skippable: true },
        { id: 's3', caption: 'Three', skippable: true },
      ],
      menu: { items: [{ id: 'm1', label: 'Play', action: 'play' }] },
    };
    expect(nextSplashIndex(start, 0, 'timeout')).toBe(2);
    expect(nextSplashIndex(start, 2, 'timeout')).toBe('menu');
  });

  it('jumps to play when the last remaining splash is skippable and there is no menu', () => {
    const start: GameStart = {
      splashes: [
        { id: 's1', caption: 'One', skippable: true },
        { id: 's2', caption: 'Two', skippable: true },
      ],
      menu: { items: [] },
    };
    expect(nextSplashIndex(start, 0, 'skip')).toBe('play');
  });

  it('jumps to menu when remaining splashes are skippable', () => {
    const start: GameStart = {
      splashes: [
        { id: 's1', caption: 'One', skippable: true },
        { id: 's2', caption: 'Two', skippable: true },
      ],
      menu: { items: [{ id: 'm1', label: 'Play', action: 'play' }] },
    };
    expect(nextSplashIndex(start, 0, 'skip')).toBe('menu');
  });
});
