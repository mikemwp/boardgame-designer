'use client';

import { hudDieRotation } from '@/lib/view/hud-dice';

function DieCube({ face, tumbling }: { face: number; tumbling: boolean }) {
  const rot = hudDieRotation(face);
  return (
    <div className="hud-die-scene" aria-label={`Die showing ${face}`} role="img">
      <div
        className={tumbling ? 'hud-die hud-die--tumble' : 'hud-die'}
        style={tumbling ? undefined : { transform: `rotateX(${rot.rotateX}deg) rotateY(${rot.rotateY}deg)` }}
      >
        <span className="hud-die-face hud-die-face--1">1</span>
        <span className="hud-die-face hud-die-face--2">2</span>
        <span className="hud-die-face hud-die-face--3">3</span>
        <span className="hud-die-face hud-die-face--4">4</span>
        <span className="hud-die-face hud-die-face--5">5</span>
        <span className="hud-die-face hud-die-face--6">6</span>
      </div>
    </div>
  );
}

export function HudDice({
  faces,
  tumbling,
  rollId,
}: {
  faces: number[];
  tumbling: boolean;
  rollId: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6 py-4" data-testid="hud-dice" data-roll-id={rollId}>
      {faces.map((face, index) => (
        <DieCube key={`${rollId}-${index}`} face={face} tumbling={tumbling} />
      ))}
    </div>
  );
}
