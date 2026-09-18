import type { Board, StairLanding } from './board';
import { listLegalStairLandings } from './board';
import type { Rng } from './dice';

export function sampleStairLanding(board: Board, fromFloorId: string, rng: Rng): StairLanding | null {
  const legal = listLegalStairLandings(board, fromFloorId);
  if (legal.length === 0) return null;
  const idx = Math.floor(rng() * legal.length);
  return legal[idx] ?? null;
}
