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

  it('allows card-only room and door cells', () => {
    const room: Cell = { id: 'r1', index: 8, kind: 'room', packId: 'notes', col: 1, row: 1 };
    const door: Cell = { id: 'd1', index: 1, kind: 'door', col: 1, row: 0 };
    expect(room.kind).toBe('room');
    expect(door.kind).toBe('door');
    expect(room.packId).toBe('notes');
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

  it('allows optional designer grid fields', () => {
    const floor: Floor = {
      id: 'ground',
      index: 0,
      label: 'Ground',
      columns: 8,
      rows: 6,
      hud: { col: 2, row: 2, width: 4, height: 2 },
      cells: [{ id: 'ground-c0', index: 0, col: 0, row: 0, start: true }],
    };
    expect(floor.hud?.col).toBe(2);
    expect(floor.cells[0]?.start).toBe(true);
  });

  it('stores an optional board shape on the floor and region on the cell', () => {
    const floor: Floor = {
      id: 'ground',
      index: 0,
      label: 'Ground',
      shape: { kind: 'square', tilesPerSide: 8 },
      cells: [
        {
          id: 'ground-c0',
          index: 0,
          region: 'ring',
          slot: 0,
          start: true,
        },
      ],
    };
    expect(floor.shape?.kind).toBe('square');
    expect(floor.cells[0]?.region).toBe('ring');
  });
});
