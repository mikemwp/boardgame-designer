'use client';

import { GameHud } from '@/components/hud/GameHud';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Building Board Template</h1>
        <p className="text-slate-400">Sample: {CLIMB_LABEL}</p>
      </header>
      <GameHud bootstrap={climbSample} />
    </main>
  );
}
