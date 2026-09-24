'use client';

import { useRef, useState } from 'react';
import { AudioField } from '@/components/designer/AudioField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { GameStart, ImageRef, StartMenuAction } from '@/lib/engine/types';
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

function nextMenuDefaults(start: GameStart): { label: string; action: StartMenuAction } {
  const usedContinue = start.menu.items.some((item) => item.action === 'continue');
  if (start.menu.items.length === 0) return { label: 'Play', action: 'play' };
  if (!usedContinue) return { label: 'Continue', action: 'continue' };
  return { label: 'Play', action: 'play' };
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
          No splash screens. Test and Play skip straight to the board unless you add a menu.
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
      <p className="text-sm font-medium text-slate-100">Start menu</p>
      {value.menu.items.length === 0 ? (
        <p className="text-sm text-slate-400">
          No menu items. After splashes (if any), play starts by itself.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {value.menu.items.map((item, index) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-md border border-slate-800 p-2">
              <Label htmlFor={`menu-label-${item.id}`}>Label</Label>
              <Input
                id={`menu-label-${item.id}`}
                aria-label="Menu label"
                value={item.label}
                onChange={(e) => onChange(updateMenuItem(value, item.id, { label: e.target.value }))}
              />
              <Label htmlFor={`menu-action-${item.id}`}>Action</Label>
              <select
                id={`menu-action-${item.id}`}
                aria-label="Action"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={item.action}
                onChange={(e) =>
                  onChange(updateMenuItem(value, item.id, { action: e.target.value as StartMenuAction }))
                }
              >
                <option value="play">Play</option>
                <option value="continue">Continue</option>
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => onChange(moveMenuItem(value, item.id, -1))}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === value.menu.items.length - 1}
                  onClick={() => onChange(moveMenuItem(value, item.id, 1))}
                >
                  Down
                </Button>
                <Button type="button" variant="outline" onClick={() => onChange(removeMenuItem(value, item.id))}>
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
        onClick={() => {
          const defaults = nextMenuDefaults(value);
          onChange(
            addMenuItem(value, {
              id: nextMenuItemId(value),
              label: defaults.label,
              action: defaults.action,
            }),
          );
        }}
      >
        Add item
      </Button>
    </div>
  );
}
