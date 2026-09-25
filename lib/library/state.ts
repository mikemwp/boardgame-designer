import type { FloatingPack } from '@/lib/designer/packs';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import type { Card, ImageRef } from '@/lib/engine/types';
import type {
  GameDocument,
  GameStatus,
  LibraryState,
  NewGameSource,
  StoredBootstrap,
} from '@/lib/library/types';
import { applySaveBump, documentStatus } from '@/lib/library/version';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

export function createDocument(input: {
  id: string;
  name: string;
  source: NewGameSource;
  bootstrap: StoredBootstrap;
  now: string;
  published?: boolean;
  status?: GameStatus;
  version?: string | null;
  publishedAt?: string;
  lastSaved?: string;
  slug?: string;
}): GameDocument {
  const status: GameStatus = input.status ?? (input.published ? 'published' : 'draft');
  return {
    id: input.id,
    name: input.name,
    source: input.source,
    bootstrap: input.bootstrap,
    createdAt: input.now,
    updatedAt: input.now,
    lastSaved: input.lastSaved ?? input.now,
    status,
    version: input.version ?? (status === 'published' ? '1' : null),
    ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
    ...(status === 'published' || input.published ? { published: true } : {}),
    ...(input.slug ? { slug: input.slug } : {}),
  };
}

export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'game';
}

export function uniquePublishedSlug(state: LibraryState, name: string, keepId?: string): string {
  const base = slugifyName(name);
  const taken = new Set(
    state.drafts.filter((d) => d.id !== keepId && d.slug).map((d) => d.slug as string),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function findPublishedBySlug(state: LibraryState, slug: string): GameDocument | undefined {
  return state.drafts.find((d) => d.slug === slug && documentStatus(d) === 'published');
}

export function publishDocument(doc: GameDocument, now: string, slug?: string): GameDocument {
  const version = doc.version ?? '1';
  const nextSlug = doc.slug ?? slug ?? slugifyName(doc.name);
  return {
    ...doc,
    status: 'published',
    published: true,
    version,
    publishedAt: now,
    lastSaved: now,
    updatedAt: now,
    slug: nextSlug,
  };
}

export function isPublished(doc: GameDocument | undefined): boolean {
  return doc?.published === true;
}

export function seedLibrary(now: string, id: string): LibraryState {
  const doc = createDocument({
    id,
    name: CLIMB_LABEL,
    source: 'climb',
    bootstrap: toStoredBootstrap(climbSample),
    now,
  });
  return { version: 1, activeId: doc.id, drafts: [doc] };
}

export function addDraft(state: LibraryState, doc: GameDocument): LibraryState {
  return {
    ...state,
    activeId: doc.id,
    drafts: [...state.drafts, doc],
  };
}

export function saveDraft(
  state: LibraryState,
  id: string,
  bootstrap: StoredBootstrap,
  now: string,
  touchUpdatedAtOrOptions: boolean | { touchUpdatedAt?: boolean; bump?: 'none' | 'save' } = true,
): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  const options =
    typeof touchUpdatedAtOrOptions === 'boolean'
      ? { touchUpdatedAt: touchUpdatedAtOrOptions, bump: 'none' as const }
      : {
          touchUpdatedAt: touchUpdatedAtOrOptions.touchUpdatedAt ?? true,
          bump: touchUpdatedAtOrOptions.bump ?? 'none',
        };
  return {
    ...state,
    drafts: state.drafts.map((d) => {
      if (d.id !== id) return d;
      const bumped = options.bump === 'save' ? applySaveBump(d) : d;
      return {
        ...bumped,
        bootstrap,
        ...(options.touchUpdatedAt ? { updatedAt: now, lastSaved: now } : {}),
      };
    }),
  };
}

export function setActive(state: LibraryState, id: string): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  return { ...state, activeId: id };
}

export function getActive(state: LibraryState): GameDocument | undefined {
  return state.drafts.find((d) => d.id === state.activeId);
}

export function deleteDraft(state: LibraryState, id: string): LibraryState {
  const target = state.drafts.find((d) => d.id === id);
  if (!target || isPublished(target)) return state;
  const drafts = state.drafts.filter((d) => d.id !== id);
  if (drafts.length === 0) {
    return { ...state, drafts, activeId: null };
  }
  const remaining = { ...state, drafts, activeId: drafts[0]!.id };
  const nextActive =
    state.activeId && state.activeId !== id && drafts.some((d) => d.id === state.activeId)
      ? state.activeId
      : listDrafts(remaining)[0]!.id;
  return { ...state, drafts, activeId: nextActive };
}

export function listDrafts(state: LibraryState): GameDocument[] {
  return [...state.drafts].sort((a, b) => {
    if (a.updatedAt === b.updatedAt) return a.name.localeCompare(b.name);
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredBootstrap(value: unknown): value is StoredBootstrap {
  if (!isRecord(value)) return false;
  if (!isRecord(value.board) || !Array.isArray(value.board.floors) || !Array.isArray(value.board.stairs)) {
    return false;
  }
  if (!isRecord(value.players) || !Array.isArray(value.players.players)) return false;
  if (!Array.isArray(value.cards)) return false;
  if (value.packs !== undefined && (!Array.isArray(value.packs) || value.packs.some((id) => typeof id !== 'string'))) {
    return false;
  }
  if (value.packBacks !== undefined && !isRecord(value.packBacks)) return false;
  if (!isRecord(value.config)) return false;
  return true;
}

function parseImageRef(value: unknown): ImageRef | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  if (value.source !== 'url' && value.source !== 'file') return null;
  return {
    id: value.id,
    name: value.name,
    source: value.source,
    ...(typeof value.src === 'string' ? { src: value.src } : {}),
    ...(typeof value.mime === 'string' ? { mime: value.mime } : {}),
  };
}

function parseCard(value: unknown): Card | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.pack !== 'string' || typeof value.title !== 'string') {
    return null;
  }
  const image = value.image === undefined ? undefined : parseImageRef(value.image);
  if (value.image !== undefined && !image) return null;
  return {
    id: value.id,
    pack: value.pack,
    title: value.title,
    ...(typeof value.body === 'string' ? { body: value.body } : {}),
    ...(typeof value.timerSeconds === 'number' ? { timerSeconds: value.timerSeconds } : {}),
    ...(typeof value.extraButton === 'string' ? { extraButton: value.extraButton } : {}),
    ...(Array.isArray(value.tags) ? { tags: value.tags.filter((tag): tag is string => typeof tag === 'string') } : {}),
    ...(image ? { image } : {}),
  };
}

function parseFloatingPack(value: unknown): FloatingPack | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || !Array.isArray(value.cards)) {
    return null;
  }
  const cards = value.cards.map(parseCard).filter((card): card is Card => card !== null);
  const backImage = value.backImage === undefined ? undefined : parseImageRef(value.backImage);
  if (value.backImage !== undefined && !backImage) return null;
  return {
    id: value.id,
    name: value.name,
    cards,
    ...(backImage ? { backImage } : {}),
  };
}

function parsePackBacks(value: unknown): Record<string, ImageRef> | undefined {
  if (!isRecord(value)) return undefined;
  const next: Record<string, ImageRef> = {};
  for (const [key, entry] of Object.entries(value)) {
    const image = parseImageRef(entry);
    if (image) next[key] = image;
  }
  return Object.keys(next).length > 0 ? next : {};
}

function isNewGameSource(value: unknown): value is NewGameSource {
  return value === 'climb' || value === 'empty' || value === 'copy';
}

function parseDocument(value: unknown): GameDocument | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  if (!isNewGameSource(value.source)) return null;
  if (!isStoredBootstrap(value.bootstrap)) return null;
  const published = value.published === true;
  const status: GameStatus =
    value.status === 'published' || value.status === 'draft'
      ? value.status
      : published
        ? 'published'
        : 'draft';
  const version =
    typeof value.version === 'string' && value.version.length > 0
      ? value.version
      : status === 'published'
        ? '1'
        : null;
  const lastSaved =
    typeof value.lastSaved === 'string' && value.lastSaved.length > 0
      ? value.lastSaved
      : value.updatedAt;
  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    lastSaved,
    source: value.source,
    bootstrap: {
      ...value.bootstrap,
      ...(value.bootstrap.packBacks
        ? { packBacks: parsePackBacks(value.bootstrap.packBacks) ?? value.bootstrap.packBacks }
        : {}),
    },
    status,
    version,
    ...(typeof value.publishedAt === 'string' ? { publishedAt: value.publishedAt } : {}),
    ...(published || status === 'published' ? { published: true } : {}),
    ...(typeof value.slug === 'string' && value.slug.length > 0 ? { slug: value.slug } : {}),
  };
}

export function parseLibrary(raw: string | null): LibraryState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.drafts)) {
      return null;
    }
    const drafts = value.drafts
      .map(parseDocument)
      .filter((d): d is GameDocument => d !== null);
    const floatingPacks = Array.isArray(value.floatingPacks)
      ? value.floatingPacks.map(parseFloatingPack).filter((pack): pack is FloatingPack => pack !== null)
      : [];
    const floatingCards = Array.isArray(value.floatingCards)
      ? value.floatingCards.map(parseCard).filter((card): card is Card => card !== null)
      : [];
    if (drafts.length === 0) {
      return { version: 1, activeId: null, drafts: [], floatingPacks, floatingCards };
    }
    const activeId =
      typeof value.activeId === 'string' && drafts.some((d) => d.id === value.activeId)
        ? value.activeId
        : drafts[0]!.id;
    return { version: 1, activeId, drafts, floatingPacks, floatingCards };
  } catch {
    return null;
  }
}
