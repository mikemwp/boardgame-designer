import { describe, it, expect, vi } from 'vitest';
import {
  MUTE_STORAGE_KEY,
  createAudioPlayer,
  readMute,
  resolveRef,
  writeMute,
} from '@/lib/view/audio-player';
import { memoryMediaStore } from '@/lib/library/media-store';

function mockAudio(playImpl?: () => Promise<void>) {
  return {
    src: '',
    muted: false,
    paused: true,
    play: vi.fn(playImpl ?? (async () => {})),
    pause: vi.fn(function (this: { paused: boolean }) {
      this.paused = true;
    }),
  } as unknown as HTMLAudioElement;
}

describe('mute storage', () => {
  it('reads and writes the mute flag', () => {
    const storage = new Map<string, string>();
    const api = {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
    };
    expect(readMute(api)).toBe(false);
    writeMute(true, api);
    expect(storage.get(MUTE_STORAGE_KEY)).toBe('1');
    expect(readMute(api)).toBe(true);
  });
});

describe('createAudioPlayer', () => {
  it('plays sfx and reports blocked autoplay', async () => {
    const sfx = mockAudio();
    const music = mockAudio();
    const player = createAudioPlayer({ sfx, music });
    expect(await player.playSfx('https://ex/a.mp3')).toBe('played');
    expect(sfx.src).toBe('https://ex/a.mp3');

    const blocked = mockAudio(async () => {
      throw new DOMException('blocked', 'NotAllowedError');
    });
    const blockedPlayer = createAudioPlayer({ sfx: blocked, music: mockAudio() });
    expect(await blockedPlayer.playSfx('https://ex/a.mp3')).toBe('blocked');
  });

  it('returns missing when the url is empty', async () => {
    const player = createAudioPlayer({ sfx: mockAudio(), music: mockAudio() });
    expect(await player.playSfx('')).toBe('missing');
    expect(await player.playMusic('')).toBe('missing');
  });

  it('stops music and mutes both elements', async () => {
    const sfx = mockAudio();
    const music = mockAudio();
    const player = createAudioPlayer({ sfx, music });
    await player.playMusic('https://ex/m.mp3');
    player.setMuted(true);
    expect(sfx.muted).toBe(true);
    expect(music.muted).toBe(true);
    expect(music.pause).toHaveBeenCalled();
    player.stopMusic();
    expect(music.pause).toHaveBeenCalled();
  });
});

describe('resolveRef', () => {
  it('returns a url src and an object url for a stored file', async () => {
    const media = memoryMediaStore();
    await media.put('g1', 'a1', new Blob(['x'], { type: 'audio/mpeg' }));
    expect(
      await resolveRef({ id: 'u', name: 'u', source: 'url', src: 'https://ex/a.mp3' }, media, 'g1'),
    ).toBe('https://ex/a.mp3');
    const fileUrl = await resolveRef({ id: 'a1', name: 'a.mp3', source: 'file' }, media, 'g1');
    expect(fileUrl).toMatch(/^blob:/);
    expect(await resolveRef({ id: 'missing', name: 'm', source: 'file' }, media, 'g1')).toBeUndefined();
  });
});
