import { useCallback, useState } from 'react';
import { createGame, dispatch, type GameState, type GameBootstrap } from '@/lib/engine/game';
import type { GameCommand } from '@/lib/engine/events';
import type { GameConfig } from '@/lib/engine/types';
import type { Card } from '@/lib/engine/types';
import { createCardState } from '@/lib/engine/cards';

export function createGameStore(bootstrap: GameBootstrap) {
  let state = createGame(bootstrap);
  return {
    getState: () => state,
    dispatch: (cmd: GameCommand) => {
      state = dispatch(state, cmd);
      return state;
    },
  };
}

export function useGameStore(bootstrap: GameBootstrap) {
  const [game, setGame] = useState(() => createGame(bootstrap));
  const send = useCallback((cmd: GameCommand) => {
    setGame((g) => dispatch(g, cmd));
  }, []);
  const updateConfig = useCallback((patch: Partial<GameConfig>) => {
    setGame((g) => ({ ...g, config: { ...g.config, ...patch } }));
  }, []);
  const importCards = useCallback((cards: Card[]) => {
    setGame((g) => ({
      ...g,
      cards: createCardState([...g.cards.deck, ...cards]),
    }));
  }, []);
  return { game, dispatch: send, lastEvent: game.lastEvent, updateConfig, importCards };
}
