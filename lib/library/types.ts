import type { Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';
import type { Card, GameConfig, GameStart, ImageRef, InventoryItem, ItemAssign, SpinnerDef } from '@/lib/engine/types';
import type { FloatingPack } from '@/lib/designer/packs';

export type { FloatingPack };

export const LIBRARY_STORAGE_KEY = 'building-board.library.v1';
export const LIBRARY_VERSION = 1 as const;
export const GAME_BUNDLE_FORMAT = 'building-board.game';
export const GAME_SCHEMA_VERSION = 1 as const;

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
  packBacks?: Record<string, ImageRef>;
  config: GameConfig;
  gameStart?: GameStart;
  spinners?: SpinnerDef[];
  items?: InventoryItem[];
  itemAssign?: ItemAssign;
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

export interface GameBundle {
  format: typeof GAME_BUNDLE_FORMAT;
  schemaVersion: typeof GAME_SCHEMA_VERSION;
  id: string;
  name: string;
  version: string | null;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
  lastSaved: string;
  source: NewGameSource;
  publishedAt?: string;
  published?: boolean;
  slug?: string;
  bootstrap: StoredBootstrap;
}

export interface LibraryState {
  version: 1;
  activeId: string | null;
  drafts: GameDocument[];
  floatingPacks?: FloatingPack[];
  floatingCards?: Card[];
}
