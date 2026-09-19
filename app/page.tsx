'use client';

import { BoardScene } from '@/components/board/BoardScene';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';
import { createGame } from '@/lib/engine/game';

const previewGame = createGame(climbSample);

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <h1 className="text-2xl font-semibold">Building Board Template</h1>
      <p className="text-slate-400 mb-4">Sample: {CLIMB_LABEL}</p>
      <BoardScene game={previewGame} />
    </main>
  );
}
