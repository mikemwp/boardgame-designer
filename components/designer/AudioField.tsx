'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AudioRef } from '@/lib/engine/types';
import {
  AUDIO_SIZE_WARN_BYTES,
  isAllowedAudioMime,
  memoryMediaStore,
  objectUrlFor,
  type MediaStore,
} from '@/lib/library/media-store';

const AUDIO_ACCEPT = 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm';

function urlName(src: string): string {
  try {
    const parsed = new URL(src);
    const path = parsed.pathname.replace(/^\//, '');
    return path ? `${parsed.host}/${path}` : parsed.host;
  } catch {
    return src;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AudioField({
  value,
  gameId,
  media,
  onChange,
  idPrefix,
}: {
  value?: AudioRef;
  gameId: string;
  media?: MediaStore;
  onChange: (next: AudioRef | undefined) => void;
  idPrefix: string;
}) {
  const store = media ?? memoryMediaStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const [urlDraft, setUrlDraft] = useState(value?.source === 'url' ? (value.src ?? '') : '');
  const [error, setError] = useState<string | null>(null);
  const [sizeWarn, setSizeWarn] = useState(false);

  useEffect(() => {
    setUrlDraft(value?.source === 'url' ? (value.src ?? '') : '');
  }, [value?.id, value?.source, value?.src]);

  const commitUrl = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (value) await clear();
      return;
    }
    if (!isHttpUrl(trimmed)) {
      setError('Use an http or https URL.');
      return;
    }
    setError(null);
    setSizeWarn(false);
    if (value?.source === 'file') {
      await store.delete(gameId, value.id);
    }
    onChange({
      id: value?.source === 'url' ? value.id : crypto.randomUUID(),
      name: urlName(trimmed),
      source: 'url',
      src: trimmed,
    });
  };

  const clear = async () => {
    if (value?.source === 'file') {
      await store.delete(gameId, value.id);
    }
    setError(null);
    setSizeWarn(false);
    setUrlDraft('');
    onChange(undefined);
  };

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAllowedAudioMime(file.type)) {
      setError('Use an MP3, WAV, OGG, M4A, or WEBM file.');
      return;
    }
    setError(null);
    setSizeWarn(file.size > AUDIO_SIZE_WARN_BYTES);
    if (value?.source === 'file') {
      await store.delete(gameId, value.id);
    }
    const id = crypto.randomUUID();
    try {
      await store.put(gameId, id, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not store the file on this device.');
      return;
    }
    onChange({
      id,
      name: file.name,
      source: 'file',
      mime: file.type,
    });
  };

  const playPreview = async () => {
    const el = previewRef.current;
    if (!el || !value) return;
    let src = value.source === 'url' ? value.src : undefined;
    if (value.source === 'file') {
      const blob = await store.get(gameId, value.id);
      if (blob) src = objectUrlFor(blob);
    }
    if (!src) return;
    el.src = src;
    void el.play().catch(() => {});
  };

  return (
    <div className="flex flex-col gap-2" data-testid={`${idPrefix}-audio`}>
      <Label htmlFor={`${idPrefix}-url`}>Audio</Label>
      {!value ? (
        <p className="text-sm text-slate-400">No audio. Paste a URL or choose a file.</p>
      ) : (
        <p className="text-sm text-slate-200">{value.name}</p>
      )}
      <Input
        id={`${idPrefix}-url`}
        aria-label="Audio URL"
        placeholder="https://…"
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onBlur={() => void commitUrl(urlDraft)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={AUDIO_ACCEPT}
        aria-label="Choose file"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          void chooseFile(file);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          Choose file
        </Button>
        {value ? (
          <>
            <Button type="button" variant="outline" onClick={() => void playPreview()}>
              Play
            </Button>
            <Button type="button" variant="outline" onClick={() => void clear()}>
              Clear
            </Button>
          </>
        ) : null}
      </div>
      <audio ref={previewRef} data-testid="audio-preview" className="hidden" />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {sizeWarn ? (
        <p className="text-sm text-amber-400">This file is larger than 5 MB. It may not save on every browser.</p>
      ) : null}
    </div>
  );
}
