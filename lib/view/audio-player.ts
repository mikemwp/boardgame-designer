import type { AudioRef } from '@/lib/engine/types';
import { objectUrlFor, type MediaStore } from '@/lib/library/media-store';

export const MUTE_STORAGE_KEY = 'building-board.mute';

export function readMute(storage?: { getItem(k: string): string | null }): boolean {
  const store = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
  if (!store) return false;
  return store.getItem(MUTE_STORAGE_KEY) === '1';
}

export function writeMute(
  value: boolean,
  storage?: { setItem(k: string, v: string): void },
): void {
  const store = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
  store?.setItem(MUTE_STORAGE_KEY, value ? '1' : '0');
}

export async function resolveRef(
  ref: AudioRef | undefined,
  media: MediaStore,
  gameId: string,
): Promise<string | undefined> {
  if (!ref) return undefined;
  if (ref.source === 'url') return ref.src;
  const blob = await media.get(gameId, ref.id);
  if (!blob) return undefined;
  return objectUrlFor(blob);
}

export interface PlayableAudio {
  playSfx(url: string): Promise<'played' | 'blocked' | 'missing'>;
  playMusic(url: string): Promise<'played' | 'blocked' | 'missing'>;
  stopMusic(): void;
  setMuted(muted: boolean): void;
}

function playResult(error: unknown): 'blocked' | 'missing' {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'blocked';
  return 'missing';
}

export function createAudioPlayer(opts?: {
  sfx?: HTMLAudioElement;
  music?: HTMLAudioElement;
}): PlayableAudio {
  const sfx = opts?.sfx ?? (typeof Audio === 'undefined' ? undefined : new Audio());
  const music = opts?.music ?? (typeof Audio === 'undefined' ? undefined : new Audio());
  let muted = false;
  let musicUrl: string | undefined;

  const playEl = async (
    el: HTMLAudioElement | undefined,
    url: string,
    kind: 'sfx' | 'music',
  ): Promise<'played' | 'blocked' | 'missing'> => {
    if (!url) return 'missing';
    if (!el) return 'missing';
    if (kind === 'sfx') {
      el.pause();
    }
    el.src = url;
    el.muted = muted;
    if (kind === 'music') musicUrl = url;
    if (muted) {
      el.pause();
      return 'played';
    }
    try {
      await el.play();
      return 'played';
    } catch (error) {
      return playResult(error);
    }
  };

  return {
    playSfx(url) {
      return playEl(sfx, url, 'sfx');
    },
    playMusic(url) {
      return playEl(music, url, 'music');
    },
    stopMusic() {
      if (!music) return;
      music.pause();
      musicUrl = undefined;
    },
    setMuted(next) {
      muted = next;
      if (sfx) {
        sfx.muted = next;
        if (next) sfx.pause();
      }
      if (music) {
        music.muted = next;
        if (next) {
          music.pause();
        } else if (musicUrl) {
          music.src = musicUrl;
          void music.play().catch(() => {});
        }
      }
    },
  };
}
