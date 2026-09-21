import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import type { Cell } from '@/lib/engine/types';

export const CLIMB_LABEL = 'Climb (sample)';

function loopCells(floorId: string, stairId: string | null, packAt: number[]): Cell[] {
  return [0, 1, 2, 3, 4, 5].map((index) => {
    const isStair = stairId !== null && index === 3;
    return {
      id: `${floorId}-c${index}`,
      index,
      kind: isStair ? 'stair' : 'corridor',
      stairId: isStair ? stairId : undefined,
      packId: !isStair && packAt.includes(index) ? 'climb' : undefined,
    };
  });
}

const floors = [
  {
    id: 'lobby',
    index: 0,
    label: 'Lobby',
    holdEnabled: false,
    cells: loopCells('lobby', 's-lobby-f1', [1, 4]),
  },
  {
    id: 'f1',
    index: 1,
    label: 'Floor 1',
    holdEnabled: true,
    holdQuotas: { climb: 1 },
    cells: loopCells('f1', 's-f1-f2', [0, 2, 5]),
  },
  {
    id: 'f2',
    index: 2,
    label: 'Floor 2',
    holdEnabled: false,
    cells: loopCells('f2', null, [1, 4]),
  },
];

const stairs = [
  { id: 's-lobby-f1', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1-c0', legal: true },
  { id: 's-f1-f2', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'f2-c0', legal: true },
];

const cards = [
  { id: 'climb-1', pack: 'climb', title: 'First Rung', body: 'A foothold on the Lobby loop.' },
  { id: 'climb-2', pack: 'climb', title: 'Loose Brick', body: 'The mortar is crumbling.' },
  { id: 'climb-3', pack: 'climb', title: 'Handhold', body: 'Reach up and pull.' },
];

export const climbSample: GameBootstrap = {
  board: createBoard(floors, stairs),
  players: addPlayer(createPlayerState(), {
    id: 'p1',
    name: 'Climber',
    token: { floorId: 'lobby', cellId: 'lobby-c0' },
  }),
  cards: createCardState(cards),
  config: {
    diceEnabled: true,
    holdEnabled: true,
    passesEnabled: true,
    passesPerPack: { climb: 1 },
    actionMode: 'both',
    diceCount: 1,
    diceSides: 6,
    movementViz: 'dice',
  },
};
