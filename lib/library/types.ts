import type { Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';
import type { Card, GameConfig } from '@/lib/engine/types';

export const LIBRARY_STORAGE_KEY = 'building-board.library.v1';
export const LIBRARY_VERSION = 1 as const;

export type NewGameSource = 'climb' | 'empty' | 'copy';
export type GameStatus = 'draft' | 'published';

export type NewGameInput = {
  name: string;
  source: 'climb' | 'empty' | { copyFrom: string };
};

export interface StoredBootstrap {
  board: Board;
  players: PlayerState;
  cards: Card[];
  packs?: string[];
  config: GameConfig;
}

export interface GameDocument {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastSaved: string;
  source: NewGameSource;
  bootstrap: StoredBootstrap;
  status: GameStatus;
  version: string | null;
  publishedAt?: string;
  published?: boolean;
  slug?: string;
}

export interface LibraryState {
  version: 1;
  activeId: string | null;
  drafts: GameDocument[];
}
