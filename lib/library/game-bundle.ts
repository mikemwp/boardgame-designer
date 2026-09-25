import { cloneJson } from '@/lib/library/bootstrap';
import type { MediaStore } from '@/lib/library/media-store';
import {
  GAME_BUNDLE_FORMAT,
  GAME_SCHEMA_VERSION,
  type GameBundle,
  type GameDocument,
  type StoredBootstrap,
} from '@/lib/library/types';
import { bytesToArrayBuffer, decodeZip, encodeZip } from '@/lib/library/zip';

const FORBIDDEN_KEYS = new Set(['price', 'prices', 'account', 'accounts', 'listing', 'listingText']);

function hasEmbeddedMedia(value: unknown): boolean {
  if (typeof value === 'string') return value.startsWith('data:') || /;base64,/.test(value);
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(hasEmbeddedMedia);
}

function walkFileRefs(value: unknown, found: Array<{ id: string; mime?: string }>): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => walkFileRefs(entry, found));
    return;
  }
  const record = value as Record<string, unknown>;
  if (record.source === 'file' && typeof record.id === 'string') {
    found.push({
      id: record.id,
      ...(typeof record.mime === 'string' ? { mime: record.mime } : {}),
    });
  }
  for (const nested of Object.values(record)) walkFileRefs(nested, found);
}

export function collectFileMediaRefs(bootstrap: StoredBootstrap): Array<{ id: string; mime?: string }> {
  const found: Array<{ id: string; mime?: string }> = [];
  walkFileRefs(bootstrap, found);
  const seen = new Set<string>();
  return found.filter((ref) => {
    if (seen.has(ref.id)) return false;
    seen.add(ref.id);
    return true;
  });
}

export function toGameBundle(doc: GameDocument): GameBundle {
  return {
    format: GAME_BUNDLE_FORMAT,
    schemaVersion: GAME_SCHEMA_VERSION,
    id: doc.id,
    name: doc.name,
    version: doc.version,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastSaved: doc.lastSaved,
    source: doc.source,
    ...(doc.publishedAt ? { publishedAt: doc.publishedAt } : {}),
    ...(doc.published ? { published: true } : {}),
    ...(doc.slug ? { slug: doc.slug } : {}),
    bootstrap: cloneJson(doc.bootstrap),
  };
}

export function parseGameBundle(raw: unknown): GameBundle | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Not a game bundle.' };
  const value = raw as Record<string, unknown>;
  if (value.format !== GAME_BUNDLE_FORMAT) return { error: 'Unknown bundle format.' };
  if (value.schemaVersion !== GAME_SCHEMA_VERSION) {
    return { error: `Unknown schema version ${String(value.schemaVersion)}.` };
  }
  for (const key of FORBIDDEN_KEYS) {
    if (key in value) return { error: `Bundle must not include ${key}.` };
  }
  if (hasEmbeddedMedia(value)) return { error: 'Bundle must not embed base64 media.' };
  if (Array.isArray(value.drafts)) return { error: 'One game per bundle.' };
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return { error: 'Bundle is missing id or name.' };
  }
  if (!value.bootstrap || typeof value.bootstrap !== 'object') {
    return { error: 'Bundle is missing bootstrap.' };
  }
  return {
    format: GAME_BUNDLE_FORMAT,
    schemaVersion: GAME_SCHEMA_VERSION,
    id: value.id,
    name: value.name,
    version: typeof value.version === 'string' ? value.version : null,
    status: value.status === 'published' ? 'published' : 'draft',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    lastSaved: typeof value.lastSaved === 'string' ? value.lastSaved : new Date().toISOString(),
    source: value.source === 'climb' || value.source === 'copy' ? value.source : 'empty',
    ...(typeof value.publishedAt === 'string' ? { publishedAt: value.publishedAt } : {}),
    ...(value.published === true ? { published: true } : {}),
    ...(typeof value.slug === 'string' ? { slug: value.slug } : {}),
    bootstrap: cloneJson(value.bootstrap as StoredBootstrap),
  };
}

export function bundleToDocument(bundle: GameBundle, now: string): GameDocument {
  return {
    id: bundle.id,
    name: bundle.name,
    createdAt: bundle.createdAt,
    updatedAt: now,
    lastSaved: now,
    source: bundle.source,
    bootstrap: cloneJson(bundle.bootstrap),
    status: 'draft',
    version: bundle.version,
    ...(bundle.slug ? { slug: bundle.slug } : {}),
  };
}

export function mediaZipPath(assetId: string, mime?: string): string {
  const ext =
    mime === 'image/png'
      ? '.png'
      : mime === 'image/jpeg'
        ? '.jpg'
        : mime === 'image/webp'
          ? '.webp'
          : mime === 'audio/mpeg'
            ? '.mp3'
            : mime === 'video/mp4'
              ? '.mp4'
              : '';
  return `media/${assetId}${ext}`;
}

export function bundleFileName(doc: Pick<GameDocument, 'name'>): string {
  return `${doc.name.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'game'}.boardgame`;
}

export function zipPathAssetId(path: string): string | null {
  if (!path.startsWith('media/')) return null;
  const name = path.slice('media/'.length);
  if (!name) return null;
  return name.replace(/\.[^./]+$/, '') || name;
}

export async function packGameZip(
  doc: GameDocument,
  media: Pick<MediaStore, 'get'>,
): Promise<Uint8Array> {
  const bundle = toGameBundle(doc);
  const files: Record<string, Uint8Array> = {
    'game.json': new TextEncoder().encode(JSON.stringify(bundle, null, 2)),
  };
  for (const ref of collectFileMediaRefs(bundle.bootstrap)) {
    const blob = await media.get(doc.id, ref.id);
    if (!blob) continue;
    files[mediaZipPath(ref.id, ref.mime)] = new Uint8Array(await blob.arrayBuffer());
  }
  return encodeZip(files);
}

export async function unpackGameZip(
  bytes: Uint8Array,
): Promise<{ bundle: GameBundle; media: Record<string, Uint8Array> } | { error: string }> {
  const files = decodeZip(bytes);
  const jsonBytes = files['game.json'];
  if (!jsonBytes) return { error: 'Zip is missing game.json.' };
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(jsonBytes));
  } catch {
    return { error: 'game.json is not valid JSON.' };
  }
  const parsed = parseGameBundle(raw);
  if ('error' in parsed) return parsed;
  const media: Record<string, Uint8Array> = {};
  for (const [name, data] of Object.entries(files)) {
    if (name === 'game.json' || !name.startsWith('media/')) continue;
    media[name] = data;
  }
  return { bundle: parsed, media };
}

export async function readImportFile(
  file: File,
): Promise<{ bundle: GameBundle; media: Record<string, Uint8Array> } | { error: string }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
    return unpackGameZip(new Uint8Array(await file.arrayBuffer()));
  }
  try {
    const parsed = parseGameBundle(JSON.parse(await file.text()));
    if ('error' in parsed) return parsed;
    return { bundle: parsed, media: {} };
  } catch {
    return { error: 'Could not read that file.' };
  }
}

export async function writeImportedMedia(
  gameId: string,
  mediaFiles: Record<string, Uint8Array>,
  media: Pick<MediaStore, 'put'>,
): Promise<void> {
  for (const [path, bytes] of Object.entries(mediaFiles)) {
    const id = zipPathAssetId(path);
    if (!id) continue;
    await media.put(gameId, id, new Blob([bytesToArrayBuffer(bytes)]));
  }
}
