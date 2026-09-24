import { getFloor, type Board } from './board';
import { roomForDoor } from './layout';
import type { AudioRef, Card, GameStart } from './types';

export type AudioTarget = 'tile' | 'stair' | 'room' | 'card';

export interface AudioCue {
  target: AudioTarget;
  ownerId: string;
  audio: AudioRef;
}

export function emptyGameStart(): GameStart {
  return { splashes: [], menu: { items: [] } };
}

export function isGameStartEmpty(start: GameStart | undefined): boolean {
  if (!start) return true;
  return !start.audio && start.splashes.length === 0 && start.menu.items.length === 0;
}

export function cueForCard(card: Card | null | undefined): AudioCue[] {
  if (!card?.audio) return [];
  return [{ target: 'card', ownerId: card.id, audio: card.audio }];
}

export function cuesForLanding(board: Board, floorId: string, cellId: string): AudioCue[] {
  const floor = getFloor(board, floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell) return [];
  if (cell.kind === 'hud') return [];
  if (cell.kind === 'stair') {
    return cell.audio ? [{ target: 'stair', ownerId: cell.id, audio: cell.audio }] : [];
  }
  if (cell.kind === 'door') {
    const room = roomForDoor(floor, cell);
    if (room?.audio) return [{ target: 'room', ownerId: room.id, audio: room.audio }];
    return [];
  }
  if (cell.kind === 'room') return [];
  if (cell.audio) return [{ target: 'tile', ownerId: cell.id, audio: cell.audio }];
  return [];
}

export function cuesAfterMove(opts: {
  board: Board;
  landing: { floorId: string; cellId: string };
}): AudioCue[] {
  return cuesForLanding(opts.board, opts.landing.floorId, opts.landing.cellId);
}
