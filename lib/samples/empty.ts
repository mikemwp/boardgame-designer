import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';

export const EMPTY_LABEL = 'Empty board';

export function emptyBootstrap(): GameBootstrap {
  const floor = createLoopedFloor('ground', 'Ground', 0);
  return {
    board: createBoard([floor], []),
    players: addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'Player 1',
      token: { floorId: floor.id, cellId: `${floor.id}-c0` },
    }),
    cards: createCardState([]),
    config: {
      ...defaultGameConfig(),
      diceEnabled: true,
    },
  };
}
