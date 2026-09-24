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

  it('allows an optional HUD widget on a HUD cell', () => {
    const cell: Cell = { id: 'h0', index: 20, kind: 'hud', col: 2, row: 2, hudWidget: 'dice' };
    expect(cell.hudWidget).toBe('dice');
  });

  it('allows optional card timer and extra button', () => {
    const card: import('@/lib/engine/types').Card = {
      id: 'c1',
      pack: 'notes',
      title: 'Clue',
      timerSeconds: 12,
      extraButton: 'Done',
    };
    expect(card.timerSeconds).toBe(12);
    expect(card.extraButton).toBe('Done');
  });

  it('allows optional audio on a corridor, stair, and room cell', () => {
    const clip: import('@/lib/engine/types').AudioRef = {
      id: 'a1',
      name: 'land.mp3',
      source: 'url',
      src: 'https://example.com/land.mp3',
    };
    const tile: Cell = { id: 'c1', index: 0, kind: 'corridor', audio: clip };
    const stair: Cell = { id: 'c2', index: 1, kind: 'stair', audio: clip };
    const room: Cell = { id: 'r1', index: 8, kind: 'room', audio: clip };
    expect(tile.audio?.id).toBe('a1');
    expect(stair.audio?.source).toBe('url');
    expect(room.audio?.name).toBe('land.mp3');
  });

  it('allows audio, image, and video on the same cell', () => {
    const tile: Cell = {
      id: 'c1',
      index: 0,
      kind: 'corridor',
      audio: { id: 'a1', name: 'land.mp3', source: 'url', src: 'https://ex/land.mp3' },
      image: { id: 'i1', name: 'tile.png', source: 'url', src: 'https://ex/tile.png' },
      video: { id: 'v1', name: 'cut.mp4', source: 'url', src: 'https://ex/cut.mp4' },
    };
    expect(tile.audio?.id).toBe('a1');
    expect(tile.image?.id).toBe('i1');
    expect(tile.video?.id).toBe('v1');
  });

  it('allows optional audio on a card', () => {
    const card: import('@/lib/engine/types').Card = {
      id: 'c1',
      pack: 'notes',
      title: 'Clue',
      audio: { id: 'a2', name: 'deal.wav', source: 'file', mime: 'audio/wav' },
    };
    expect(card.audio?.source).toBe('file');
  });

  it('describes an empty game start with no overlay content', () => {
    const start: import('@/lib/engine/types').GameStart = {
      splashes: [],
      menu: { items: [] },
    };
    expect(start.splashes).toEqual([]);
    expect(start.menu.items).toEqual([]);
  });
});
