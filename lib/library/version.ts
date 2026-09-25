import { LIBRARY_STORAGE_KEY } from '@/lib/library/types';
import type { GameDocument, GameStatus } from '@/lib/library/types';

export const LIBRARY_SAVE_LOCATION = `Browser localStorage (${LIBRARY_STORAGE_KEY})`;

export function bumpMinorVersion(version: string): string {
  const [majorRaw, minorRaw] = version.split('.');
  const major = Number(majorRaw);
  const minor = minorRaw === undefined || minorRaw === '' ? 0 : Number(minorRaw);
  const nextMajor = Number.isFinite(major) ? major : 1;
  const nextMinor = Number.isFinite(minor) ? minor + 1 : 1;
  return `${nextMajor}.${nextMinor}`;
}

export function documentStatus(doc: Pick<GameDocument, 'status' | 'published'>): GameStatus {
  if (doc.status) return doc.status;
  return doc.published ? 'published' : 'draft';
}

export function formatGameTitle(doc: GameDocument | undefined): string {
  if (!doc) return '';
  const status = documentStatus(doc);
  if (!doc.version) return `${doc.name} (draft)`;
  if (status === 'published') return `${doc.name} (Published) v${doc.version}`;
  return `${doc.name} (draft) v${doc.version}`;
}

export function formatDesignerChromeTitle(
  gameName: string | undefined,
  levelName?: string,
  roomName?: string,
): string {
  if (!gameName) return '';
  const place = roomName?.trim() || levelName?.trim();
  return place ? `${gameName} · ${place}` : gameName;
}

export function formatDesignerStatus(status: GameStatus, version?: string | null): string {
  if (status === 'published') return version ? `Published v${version}` : 'Published';
  return version ? `draft v${version}` : 'draft';
}

export function formatDesignerLastSaved(iso?: string): string {
  if (!iso) return 'Not saved yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not saved yet';
  return `Last saved ${date.toLocaleString()}`;
}

export function markEditedAfterPublish(doc: GameDocument): GameDocument {
  if (documentStatus(doc) !== 'published') return doc;
  return {
    ...doc,
    status: 'draft',
    published: false,
    version: bumpMinorVersion(doc.version ?? '1'),
  };
}

export function applySaveBump(doc: GameDocument): GameDocument {
  if (documentStatus(doc) !== 'draft' || !doc.version) return doc;
  return { ...doc, version: bumpMinorVersion(doc.version) };
}
