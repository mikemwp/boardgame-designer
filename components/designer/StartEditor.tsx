'use client';

import { useRef, useState } from 'react';
import { AudioField } from '@/components/designer/AudioField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addSplash,
  moveSplash,
  nextSplashId,
  removeSplash,
  setGameStartAudio,
  setStartBackground,
  setStayThroughout,
  updateSplash,
} from '@/lib/designer/game-start';
import type { GameStart, ImageRef } from '@/lib/engine/types';
import {
  AUDIO_SIZE_WARN_BYTES,
  isAllowedImageMime,
  type MediaStore,
} from '@/lib/library/media-store';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function urlName(src: string): string {
  try {
    const parsed = new URL(src);
    const path = parsed.pathname.replace(/^\//, '');
    return path ? `${parsed.host}/${path}` : parsed.host;
  } catch {
    return src;
  }
}

function splashIsEmpty(caption?: string, image?: ImageRef): boolean {
  return !image && !(caption ?? '').trim();
}

function ImagePicker({
  value,
  gameId,
  media,
  idPrefix,
  onChange,
}: {
  value?: ImageRef;
  gameId: string;
  media: MediaStore;
  idPrefix: string;
  onChange: (next: ImageRef | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(value?.source === 'url' ? (value.src ?? '') : '');
  const [error, setError] = useState<string | null>(null);
  const [sizeWarn, setSizeWarn] = useState(false);

  const commitUrl = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (value?.source === 'file') await media.delete(gameId, value.id);
      onChange(undefined);
      return;
    }
    if (!isHttpUrl(trimmed)) {
      setError('Use an http or https URL.');
      return;
    }
    setError(null);
    if (value?.source === 'file') await media.delete(gameId, value.id);
    onChange({
      id: value?.source === 'url' ? value.id : crypto.randomUUID(),
      name: urlName(trimmed),
      source: 'url',
      src: trimmed,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-image-url`}>Image</Label>
      {value ? (
        <p className="text-sm text-slate-200">{value.name}</p>
      ) : (
        <p className="text-sm text-slate-400">No image. Paste a URL or choose a file.</p>
      )}
      {value?.source === 'url' && value.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.src} alt="" className="max-h-24 w-auto rounded-md border border-slate-800" />
      ) : null}
      <Input
        id={`${idPrefix}-image-url`}
        aria-label="Image URL"
        placeholder="https://…"
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onBlur={() => void commitUrl(urlDraft)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        aria-label="Choose image"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (!isAllowedImageMime(file.type)) {
            setError('Use a PNG, JPEG, WEBP, or GIF image.');
            return;
          }
          setError(null);
          setSizeWarn(file.size > AUDIO_SIZE_WARN_BYTES);
          void (async () => {
            if (value?.source === 'file') await media.delete(gameId, value.id);
            const id = crypto.randomUUID();
            try {
              await media.put(gameId, id, file);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not store the file on this device.');
              return;
            }
            onChange({ id, name: file.name, source: 'file', mime: file.type });
          })();
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          Choose file
        </Button>
        {value ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void (async () => {
                if (value.source === 'file') await media.delete(gameId, value.id);
                setUrlDraft('');
                onChange(undefined);
              })();
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {sizeWarn ? (
        <p className="text-sm text-amber-400">This file is larger than 5 MB. It may not save on every browser.</p>
      ) : null}
    </div>
  );
}

export function StartEditor({
  value,
  gameId,
  media,
  onChange,
}: {
  value: GameStart;
  gameId: string;
  media: MediaStore;
  onChange: (next: GameStart) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="start-editor">
      <p className="text-sm font-medium text-slate-100">Game start</p>
      <AudioField
        value={value.audio}
        gameId={gameId}
        media={media}
        onChange={(audio) => onChange(setGameStartAudio(value, audio))}
        idPrefix="game-start"
      />
      <p className="text-sm font-medium text-slate-100">Splash screens</p>
      {value.splashes.length === 0 ? (
        <p className="text-sm text-slate-400">
          No splash screens. After any background, Test and Play open Join Game.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {value.splashes.map((splash, index) => (
            <li key={splash.id} className="flex flex-col gap-2 rounded-md border border-slate-800 p-2">
              <ImagePicker
                value={splash.image}
                gameId={gameId}
                media={media}
                idPrefix={`splash-${splash.id}`}
                onChange={(image) => onChange(updateSplash(value, splash.id, { image }))}
              />
              <Label htmlFor={`splash-caption-${splash.id}`}>Caption</Label>
              <Input
                id={`splash-caption-${splash.id}`}
                aria-label="Caption"
                value={splash.caption ?? ''}
                onChange={(e) => onChange(updateSplash(value, splash.id, { caption: e.target.value }))}
              />
              <Label htmlFor={`splash-duration-${splash.id}`}>Duration ms</Label>
              <Input
                id={`splash-duration-${splash.id}`}
                aria-label="Duration ms"
                type="number"
                placeholder="4000"
                value={splash.durationMs ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    onChange(updateSplash(value, splash.id, { durationMs: undefined }));
                    return;
                  }
                  onChange(updateSplash(value, splash.id, { durationMs: Number(raw) }));
                }}
              />
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={splash.skippable !== false}
                  onChange={(e) => onChange(updateSplash(value, splash.id, { skippable: e.target.checked }))}
                />
                Skippable
              </label>
              {splashIsEmpty(splash.caption, splash.image) ? (
                <p className="text-sm text-red-400">Add a caption or an image.</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => onChange(moveSplash(value, splash.id, -1))}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === value.splashes.length - 1}
                  onClick={() => onChange(moveSplash(value, splash.id, 1))}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (splash.image?.source === 'file') {
                      void media.delete(gameId, splash.image.id);
                    }
                    onChange(removeSplash(value, splash.id));
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange(
            addSplash(value, {
              id: nextSplashId(value),
              skippable: true,
            }),
          )
        }
      >
        Add splash
      </Button>
      <p className="text-sm font-medium text-slate-100">Background image</p>
      <ImagePicker
        value={value.background}
        gameId={gameId}
        media={media}
        idPrefix="start-background"
        onChange={(background) => onChange(setStartBackground(value, background))}
      />
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          aria-label="Stay throughout the game"
          checked={value.stayThroughout !== false}
          onChange={(e) => onChange(setStayThroughout(value, e.target.checked))}
        />
        Stay throughout the game
      </label>
      <p className="text-sm text-slate-400">
        After splash, players see Join Game: New game, Saved game, and Tutorial, plus Copy link and Play on this
        device. Saved game stays disabled until sessions persist. Copy link is local — seats do not sync yet.
      </p>
    </div>
  );
}
