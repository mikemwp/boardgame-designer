'use client';

import { use } from 'react';
import { PlayPublishedGame } from '@/components/library/PlayPublishedGame';

export default function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden overflow-x-hidden bg-slate-950 p-2 text-slate-50 md:p-3">
      <PlayPublishedGame slug={slug} />
    </main>
  );
}
