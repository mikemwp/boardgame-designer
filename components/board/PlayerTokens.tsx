'use client';

import { useEffect, useRef, useState } from 'react';
import type { Board } from '@/lib/engine/board';
import type { Player, TokenPos } from '@/lib/engine/types';
import { tokenPosToWorld, worldWaypoints } from '@/lib/view/board-layout';
import { slideDurationSeconds } from '@/lib/view/token-slide';
import type { Vec3 } from '@/lib/view/board-layout';
import { TokenActor, computeSlideFrame } from './TokenActor';

function initialPositions(board: Board, players: Player[]): Record<string, Vec3> {
  const positions: Record<string, Vec3> = {};
  for (const player of players) {
    positions[player.id] = tokenPosToWorld(board, player.token);
  }
  return positions;
}

export function PlayerTokens({ board, players }: { board: Board; players: Player[] }) {
  const [positions, setPositions] = useState<Record<string, Vec3>>(() =>
    initialPositions(board, players),
  );
  const prevToken = useRef<Record<string, TokenPos>>({});
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    for (const player of players) {
      const prev = prevToken.current[player.id];
      if (!prev) {
        prevToken.current[player.id] = player.token;
        setPositions((p) => ({ ...p, [player.id]: tokenPosToWorld(board, player.token) }));
        continue;
      }
      if (prev.floorId === player.token.floorId && prev.cellId === player.token.cellId) {
        continue;
      }
      const waypoints = worldWaypoints(board, prev, player.token);
      prevToken.current[player.id] = player.token;
      if (waypoints.length === 0) continue;

      let i = 0;
      let from = positionsRef.current[player.id] ?? tokenPosToWorld(board, prev);
      const runLeg = () => {
        const to = waypoints[i];
        if (!to) return;
        const distance = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
        const start = performance.now();
        const duration = Math.max(80, slideDurationSeconds(distance) * 1000);
        const tick = () => {
          const t = (performance.now() - start) / duration;
          const pos = computeSlideFrame(from, to, t);
          setPositions((p) => ({ ...p, [player.id]: pos }));
          if (t < 1) {
            animRef.current = requestAnimationFrame(tick);
          } else {
            from = to;
            i += 1;
            if (i < waypoints.length) runLeg();
          }
        };
        animRef.current = requestAnimationFrame(tick);
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      runLeg();
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [board, players]);

  return (
    <>
      {players.map((player) => (
        <TokenActor
          key={player.id}
          name={player.id}
          position={positions[player.id] ?? tokenPosToWorld(board, player.token)}
        />
      ))}
    </>
  );
}
