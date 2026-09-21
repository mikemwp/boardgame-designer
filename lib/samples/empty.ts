import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { defaultGameConfig, type Cell } from '@/lib/engine/types';

export const EMPTY_LABEL = 'Empty board';

export function emptyBootstrap(): GameBootstrap {
  const floorId = 'ground';
  const cells: Cell[] = [0, 1, 2, 3, 4, 5].map((index) => ({
    id: `${floorId}-c${index}`,
    index,
    kind: 'corridor',
  }));
  return {
    board: createBoard(
      [
        {
          id: floorId,
          index: 0,
          label: 'Ground',
          holdEnabled: false,
          cells,
        },
      ],
      [],
    ),
    players: addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'Player 1',
      token: { floorId, cellId: `${floorId}-c0` },
    }),
    cards: createCardState([]),
    config: {
      ...defaultGameConfig(),
      diceEnabled: true,
    },
  };
}
