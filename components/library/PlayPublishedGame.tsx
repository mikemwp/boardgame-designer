'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameHud } from '@/components/hud/GameHud';
import { fromStoredBootstrap } from '@/lib/library/bootstrap';
import { findPublishedBySlug, parseLibrary } from '@/lib/library/state';
import { browserStorage, type LibraryStorage } from '@/lib/library/storage';
import type { GameDocument } from '@/lib/library/types';
import { formatGameTitle } from '@/lib/library/version';

export function PlayPublishedGame({
  slug,
  storage,
}: {
  slug: string;
  storage?: LibraryStorage;
}) {
  const [ready, setReady] = useState(false);
  const [doc, setDoc] = useState<GameDocument | undefined>();

  useEffect(() => {
    const store = storage ?? browserStorage();
    const parsed = parseLibrary(store.read());
    setDoc(parsed ? findPublishedBySlug(parsed, slug) : undefined);
    setReady(true);
  }, [slug, storage]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" data-testid="play-published">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold text-slate-50 md:text-2xl">
          {ready ? (doc ? formatGameTitle(doc) : `No published game at /play/${slug} on this device.`) : 'Loading published game…'}
        </h1>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-slate-50 hover:bg-slate-600 hover:text-white"
        >
          Design
        </Link>
      </div>
      {ready && doc ? (
        <GameHud
          bootstrap={fromStoredBootstrap(doc.bootstrap)}
          gameStart={doc.bootstrap.gameStart}
          gameId={doc.id}
        />
      ) : null}
    </div>
  );
}
