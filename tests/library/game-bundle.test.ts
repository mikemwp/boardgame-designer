import { describe, expect, it } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  bundleToDocument,
  collectFileMediaRefs,
  mediaZipPath,
  packGameZip,
  parseGameBundle,
  readImportFile,
  toGameBundle,
  unpackGameZip,
  writeImportedMedia,
  zipPathAssetId,
} from '@/lib/library/game-bundle';
import { memoryMediaStore } from '@/lib/library/media-store';
import { createDocument, importGameDocument, seedLibrary } from '@/lib/library/state';
import { GAME_BUNDLE_FORMAT, GAME_SCHEMA_VERSION } from '@/lib/library/types';
import { bytesToArrayBuffer, decodeZip } from '@/lib/library/zip';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';

function sampleDoc() {
  const seeded = seedLibrary('2026-09-25T12:00:00.000Z', 'game-stable');
  const doc = seeded.drafts[0]!;
  return {
    ...doc,
    version: '1.2',
    slug: 'climb-sample',
    status: 'published' as const,
    published: true,
    publishedAt: '2026-09-24T09:00:00.000Z',
    bootstrap: {
      ...doc.bootstrap,
      cards: [
        ...doc.bootstrap.cards,
        {
          id: 'art-1',
          pack: 'climb',
          title: 'Art',
          image: { id: 'asset-cover', name: 'cover.png', source: 'file' as const, mime: 'image/png' },
        },
      ],
      packBacks: {
        climb: { id: 'asset-back', name: 'back.png', source: 'file' as const, mime: 'image/png' },
      },
    },
  };
}

describe('toGameBundle', () => {
  it('stamps schemaVersion and exports one game, not the library', () => {
    const bundle = toGameBundle(sampleDoc());
    expect(bundle.format).toBe(GAME_BUNDLE_FORMAT);
    expect(bundle.schemaVersion).toBe(GAME_SCHEMA_VERSION);
    expect(bundle.id).toBe('game-stable');
    expect(bundle.version).toBe('1.2');
    expect(bundle.slug).toBe('climb-sample');
    expect(bundle).not.toHaveProperty('drafts');
    expect(bundle).not.toHaveProperty('floatingPacks');
    expect(bundle).not.toHaveProperty('price');
    expect(bundle).not.toHaveProperty('prices');
    expect(bundle).not.toHaveProperty('account');
    expect(bundle).not.toHaveProperty('listing');
    expect(JSON.stringify(bundle)).not.toMatch(/base64|data:/i);
  });

  it('keeps the same id on re-export and leaves Version A as a string', () => {
    const first = toGameBundle(sampleDoc());
    const second = toGameBundle({ ...sampleDoc(), updatedAt: '2026-09-25T18:00:00.000Z' });
    expect(second.id).toBe(first.id);
    expect(second.version).toBe('1.2');
    expect(typeof second.version).toBe('string');
  });
});

describe('parseGameBundle', () => {
  it('rejects unknown schema, a library dump, and listing fields', () => {
    expect(parseGameBundle({ format: GAME_BUNDLE_FORMAT, schemaVersion: 9 })).toEqual({
      error: 'Unknown schema version 9.',
    });
    expect(
      parseGameBundle({
        format: GAME_BUNDLE_FORMAT,
        schemaVersion: 1,
        id: 'a',
        name: 'A',
        drafts: [],
        bootstrap: toStoredBootstrap(emptyBootstrap()),
      }),
    ).toEqual({ error: 'One game per bundle.' });
    expect(
      parseGameBundle({
        format: GAME_BUNDLE_FORMAT,
        schemaVersion: 1,
        id: 'a',
        name: 'A',
        price: 4.99,
        bootstrap: toStoredBootstrap(emptyBootstrap()),
      }),
    ).toEqual({ error: 'Bundle must not include price.' });
  });

  it('treats slug as an optional suggestion', () => {
    const parsed = parseGameBundle(toGameBundle(sampleDoc()));
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.slug).toBe('climb-sample');
    const withoutSlug = parseGameBundle({ ...parsed, slug: undefined });
    if ('error' in withoutSlug) throw new Error(withoutSlug.error);
    expect(withoutSlug.slug).toBeUndefined();
  });
});

describe('file media refs', () => {
  it('lists file refs and keeps {id, name, source, src?, mime?} without embedding bytes', () => {
    const refs = collectFileMediaRefs(sampleDoc().bootstrap);
    expect(refs.map((ref) => ref.id).sort()).toEqual(['asset-back', 'asset-cover']);
    expect(mediaZipPath('asset-cover', 'image/png')).toBe('media/asset-cover.png');
    expect(zipPathAssetId('media/asset-cover.png')).toBe('asset-cover');
    const image = sampleDoc().bootstrap.cards.find((card) => card.id === 'art-1')?.image;
    expect(image).toEqual({
      id: 'asset-cover',
      name: 'cover.png',
      source: 'file',
      mime: 'image/png',
    });
  });
});

describe('packGameZip / unpackGameZip', () => {
  it('writes game.json plus media/<assetId> and round-trips as a draft', async () => {
    const doc = sampleDoc();
    const media = memoryMediaStore();
    await media.put('game-stable', 'asset-cover', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
    await media.put('game-stable', 'asset-back', new Blob([new Uint8Array([4, 5, 6])], { type: 'image/png' }));
    const zip = await packGameZip(doc, media);
    const files = decodeZip(zip);
    expect(Object.keys(files).sort()).toEqual([
      'game.json',
      'media/asset-back.png',
      'media/asset-cover.png',
    ]);
    const json = JSON.parse(new TextDecoder().decode(files['game.json']));
    expect(json.schemaVersion).toBe(1);
    expect(json.format).toBe('building-board.game');
    expect(JSON.stringify(json)).not.toMatch(/base64|data:/i);
    expect(json.bootstrap.cards.find((card: { id: string }) => card.id === 'art-1').image).toMatchObject({
      id: 'asset-cover',
      source: 'file',
    });

    const unpacked = await unpackGameZip(zip);
    if ('error' in unpacked) throw new Error(unpacked.error);
    const imported = bundleToDocument(unpacked.bundle, '2026-09-25T15:00:00.000Z');
    expect(imported.id).toBe('game-stable');
    expect(imported.status).toBe('draft');
    expect(imported.published).toBeUndefined();
    expect(imported.version).toBe('1.2');
    expect(imported.slug).toBe('climb-sample');

    const dest = memoryMediaStore();
    await writeImportedMedia(imported.id, unpacked.media, dest);
    const cover = await dest.get('game-stable', 'asset-cover');
    expect(new Uint8Array(await cover!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe('readImportFile', () => {
  it('reads JSON or zip and keeps the game id', async () => {
    const bundle = toGameBundle(sampleDoc());
    const jsonFile = new File([JSON.stringify(bundle)], 'climb.json', { type: 'application/json' });
    const fromJson = await readImportFile(jsonFile);
    if ('error' in fromJson) throw new Error(fromJson.error);
    expect(fromJson.bundle.id).toBe('game-stable');
    expect(fromJson.media).toEqual({});

    const media = memoryMediaStore();
    await media.put('game-stable', 'asset-cover', new Blob([new Uint8Array([9])]));
    await media.put('game-stable', 'asset-back', new Blob([new Uint8Array([8])]));
    const zipFile = new File([bytesToArrayBuffer(await packGameZip(sampleDoc(), media))], 'climb.zip', {
      type: 'application/zip',
    });
    const fromZip = await readImportFile(zipFile);
    if ('error' in fromZip) throw new Error(fromZip.error);
    expect(fromZip.bundle.id).toBe('game-stable');
    expect(Object.keys(fromZip.media)).toContain('media/asset-cover.png');
  });
});

describe('importGameDocument', () => {
  it('replaces the matching id as a local draft and does not publish', () => {
    const seeded = seedLibrary('2026-09-25T12:00:00.000Z', 'game-stable');
    const incoming = bundleToDocument(toGameBundle(sampleDoc()), '2026-09-25T16:00:00.000Z');
    const next = importGameDocument(seeded, incoming);
    expect(next.activeId).toBe('game-stable');
    expect(next.drafts).toHaveLength(1);
    expect(next.drafts[0]?.id).toBe('game-stable');
    expect(next.drafts[0]?.status).toBe('draft');
    expect(next.drafts[0]?.name).toBe('Climb (sample)');
  });

  it('adds a new draft when the id is unknown', () => {
    const seeded = seedLibrary('2026-09-25T12:00:00.000Z', 'seed-1');
    const extra = createDocument({
      id: 'copied',
      name: 'Copy',
      source: 'copy',
      bootstrap: toStoredBootstrap(climbSample),
      now: '2026-09-25T16:00:00.000Z',
    });
    const next = importGameDocument(seeded, extra);
    expect(next.drafts.map((doc) => doc.id).sort()).toEqual(['copied', 'seed-1']);
    expect(next.activeId).toBe('copied');
  });
});
