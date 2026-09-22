'use client';

import { StudioShell } from '@/components/library/StudioShell';

export default function Home() {
  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden overflow-x-hidden bg-slate-950 p-2 text-slate-50 md:p-3">
      <StudioShell />
    </main>
  );
}
