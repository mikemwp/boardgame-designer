import { toStoredBootstrap } from '@/lib/library/bootstrap';
import type {
  GameDocument,
  LibraryState,
  NewGameSource,
  StoredBootstrap,
} from '@/lib/library/types';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

export function createDocument(input: {
  id: string;
  name: string;
  source: NewGameSource;
  bootstrap: StoredBootstrap;
  now: string;
}): GameDocument {
  return {
    id: input.id,
    name: input.name,
    source: input.source,
    bootstrap: input.bootstrap,
    createdAt: input.now,
    updatedAt: input.now,
  };
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
): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  return {
    ...state,
    drafts: state.drafts.map((d) =>
      d.id === id ? { ...d, bootstrap, updatedAt: now } : d,
    ),
  };
}

export function setActive(state: LibraryState, id: string): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  return { ...state, activeId: id };
}

export function getActive(state: LibraryState): GameDocument | undefined {
  return state.drafts.find((d) => d.id === state.activeId);
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
  if (!isRecord(value.config)) return false;
  return true;
}

function isNewGameSource(value: unknown): value is NewGameSource {
  return value === 'climb' || value === 'empty';
}

function parseDocument(value: unknown): GameDocument | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  if (!isNewGameSource(value.source)) return null;
  if (!isStoredBootstrap(value.bootstrap)) return null;
  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    source: value.source,
    bootstrap: value.bootstrap,
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
    if (drafts.length === 0) return null;
    const activeId =
      typeof value.activeId === 'string' && drafts.some((d) => d.id === value.activeId)
        ? value.activeId
        : drafts[0]!.id;
    return { version: 1, activeId, drafts };
  } catch {
    return null;
  }
}
