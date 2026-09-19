'use client';

import { useEffect, useRef, useState } from 'react';
import type { Board } from '@/lib/engine/board';
import type { GameEvent } from '@/lib/engine/events';
import type { Player } from '@/lib/engine/types';
import { tokenPosToWorld } from '@/lib/view/board-layout';
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

export function PlayerTokens({
  board,
  players,
  lastEvent,
}: {
  board: Board;
  players: Player[];
  lastEvent: GameEvent | null;
}) {
  const [positions, setPositions] = useState<Record<string, Vec3>>(() =>
    initialPositions(board, players),
  );
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const animRef = useRef<{
    playerId: string;
    from: Vec3;
    to: Vec3;
    start: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    setPositions(initialPositions(board, players));
  }, [board, players]);

  useEffect(() => {
    if (lastEvent?.type !== 'TOKEN_MOVED') return;

    const from = positionsRef.current[lastEvent.playerId] ?? tokenPosToWorld(board, {
      floorId: lastEvent.floorId,
      cellId: lastEvent.cellId,
    });
    const to = tokenPosToWorld(board, {
      floorId: lastEvent.floorId,
      cellId: lastEvent.cellId,
    });
    const distance = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
    animRef.current = {
      playerId: lastEvent.playerId,
      from,
      to,
      start: performance.now(),
      duration: slideDurationSeconds(distance) * 1000,
    };

    let raf = 0;
    const tick = () => {
      const anim = animRef.current;
      if (!anim) return;
      const t = (performance.now() - anim.start) / anim.duration;
      const pos = computeSlideFrame(anim.from, anim.to, t);
      setPositions((prev) => ({ ...prev, [anim.playerId]: pos }));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lastEvent, board]);

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
