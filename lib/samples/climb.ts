import { createBoard } from '@/lib/engine/board';
import { createPlayerState, addPlayer } from '@/lib/engine/players';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';

export const CLIMB_LABEL = 'Climb (sample)';

const floors = [
  { id: 'lobby', index: 0, label: 'Lobby', cells: [{ id: 'l0', index: 0 }], holdEnabled: false },
  { id: 'f1', index: 1, label: 'Floor 1', cells: [{ id: 'f1c0', index: 0 }], holdEnabled: true },
  { id: 'f2', index: 2, label: 'Floor 2', cells: [{ id: 'f2c0', index: 0 }], holdEnabled: false },
];

const stairs = [
  { id: 's0-1', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1c0', legal: true },
  { id: 's0-bypass', fromFloorId: 'lobby', toFloorId: 'f2', toCellId: 'f2c0', legal: false },
  { id: 's1-2', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'f2c0', legal: true },
];

const cards = [
  { id: 'climb-1', pack: 'climb', title: 'First Rung', body: 'Advance one floor' },
];

export const climbSample: GameBootstrap = {
  board: createBoard(floors, stairs),
  players: addPlayer(createPlayerState(), {
    id: 'p1',
    name: 'Climber',
    token: { floorId: 'lobby', cellId: 'l0' },
  }),
  cards: createCardState(cards),
  config: { diceEnabled: true, holdEnabled: true, actionMode: 'both' },
};
