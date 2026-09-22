'use client';

import { StudioShell } from '@/components/library/StudioShell';

export default function Home() {
  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden overflow-x-hidden bg-slate-950 p-2 text-slate-50 md:p-3">
      <header className="mb-2 shrink-0">
        <h1 className="text-lg font-semibold">Building Board Template</h1>
        <p className="text-sm text-slate-400">Studio — drafts stay on this device</p>
      </header>
      <StudioShell />
    </main>
  );
}
