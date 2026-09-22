import type { GameDocument, GameStatus } from '@/lib/library/types';

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
