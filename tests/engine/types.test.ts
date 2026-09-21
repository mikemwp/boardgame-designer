import { describe, it, expect } from 'vitest';
import type { Cell, Floor, GameConfig, ActionMode } from '@/lib/engine/types';
import { defaultGameConfig } from '@/lib/engine/types';

describe('GameConfig', () => {
  it('defaults actionMode to both and no caps', () => {
    const cfg: GameConfig = defaultGameConfig();
    expect(cfg.actionMode).toBe('both');
    expect(cfg.passesEnabled).toBe(false);
    expect(cfg.passesPerPack).toEqual({});
    expect(cfg.maxPlayers).toBeUndefined();
    expect(cfg.maxFloors).toBeUndefined();
  });

  it('defaults movementViz to dice', () => {
    const cfg: GameConfig = defaultGameConfig();
    expect(cfg.movementViz).toBe('dice');
    expect(cfg.diceCount).toBe(1);
  });
});

describe('Cell and Floor slice-2 fields', () => {
  it('allows corridor cells with optional pack and stair cells with stairId', () => {
    const corridor: Cell = { id: 'c1', index: 1, kind: 'corridor', packId: 'climb' };
    const stair: Cell = { id: 'c3', index: 3, kind: 'stair', stairId: 's-up' };
    expect(corridor.packId).toBe('climb');
    expect(stair.kind).toBe('stair');
    expect(stair.packId).toBeUndefined();
  });

  it('stores per-floor hold quotas', () => {
    const floor: Floor = {
      id: 'f1',
      index: 1,
      label: 'Floor 1',
      holdEnabled: true,
      holdQuotas: { climb: 1 },
      cells: [{ id: 'f1-c0', index: 0 }],
    };
    expect(floor.holdQuotas?.climb).toBe(1);
  });
});
