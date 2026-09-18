import { describe, it, expect } from 'vitest';
import type { GameConfig, ActionMode } from '@/lib/engine/types';
import { defaultGameConfig } from '@/lib/engine/types';

describe('GameConfig', () => {
  it('defaults actionMode to both and no caps', () => {
    const cfg: GameConfig = defaultGameConfig();
    expect(cfg.actionMode).toBe('both');
    expect(cfg.maxPlayers).toBeUndefined();
    expect(cfg.maxFloors).toBeUndefined();
  });
});
