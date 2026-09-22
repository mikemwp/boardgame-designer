import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createHoldState } from '@/lib/engine/hold';
import { createLoopedFloor } from '@/lib/engine/layout';
import {
  allowedMoveValues,
  forwardPathCells,
  sampleMoveValue,
  sampleStairLanding,
  walkSteps,
} from '@/lib/engine/movement';

const stairBoard = createBoard(
  [
    { id: 'f0', index: 0, label: 'L', cells: [{ id: 'c0', index: 0 }] },
    { id: 'f1', index: 1, label: '1', cells: [{ id: 'c1', index: 0 }] },
    { id: 'f2', index: 2, label: '2', cells: [{ id: 'c2', index: 0 }] },
  ],
  [
    { id: 's-ok', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: true },
    { id: 's-bad', fromFloorId: 'f0', toFloorId: 'f2', toCellId: 'c2', legal: false },
  ],
);

const loopFloor = {
  id: 'lobby',
  index: 0,
  label: 'Lobby',
  cells: [
    { id: 'l0', index: 0, kind: 'corridor' as const },
    { id: 'l1', index: 1, kind: 'corridor' as const, packId: 'climb' },
    { id: 'l2', index: 2, kind: 'corridor' as const },
    { id: 'l3', index: 3, kind: 'stair' as const, stairId: 'up' },
    { id: 'l4', index: 4, kind: 'corridor' as const },
    { id: 'l5', index: 5, kind: 'corridor' as const },
  ],
};

const loopBoard = createBoard(
  [
    loopFloor,
    {
      id: 'f1',
      index: 1,
      label: 'Floor 1',
      holdEnabled: true,
      holdQuotas: { climb: 1 },
      cells: [{ id: 'f1c0', index: 0, kind: 'corridor' }],
    },
  ],
  [{ id: 'up', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1c0', legal: true }],
);

describe('sampleStairLanding', () => {
  it('never returns illegal stair landings', () => {
    for (let i = 0; i < 20; i++) {
      const landing = sampleStairLanding(stairBoard, 'f0', () => Math.random());
      expect(landing?.stairId).toBe('s-ok');
    }
  });
});

describe('walkSteps', () => {
  it('wraps around the corridor loop', () => {
    expect(walkSteps(loopFloor, 'l4', 3)?.id).toBe('l1');
    expect(walkSteps(loopFloor, 'l0', 0)?.id).toBe('l0');
    expect(walkSteps(loopFloor, 'l0', 3)?.id).toBe('l3');
  });

  it('walks a hub/spoke detour to the spoke end and back onto the hub', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, {
      kind: 'hub-spoke',
      hubTiles: 8,
      spokeCount: 2,
      spokeTiles: 2,
    });
    const hub0 = floor.cells.find((c) => c.region === 'hub' && c.slot === 0)!;
    const spokeEnd = floor.cells.find((c) => c.region === 'spoke' && c.spokeIndex === 0 && c.slot === 1)!;
    const after = walkSteps(floor, hub0.id, 3);
    expect(walkSteps(floor, hub0.id, 2)?.id).toBe(spokeEnd.id);
    expect(after?.id).not.toBe(spokeEnd.id);
    expect(after?.region).toBe('hub');
  });

  it('still wraps a circle by index order', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0, { kind: 'circle', tiles: 8 });
    expect(walkSteps(floor, floor.cells[0]!.id, 8)?.id).toBe(floor.cells[0]!.id);
    expect(walkSteps(floor, floor.cells[0]!.id, 1)?.id).toBe(floor.cells[1]!.id);
  });
});

describe('forwardPathCells', () => {
  it('lists each cell from start exclusive to end inclusive', () => {
    expect(forwardPathCells(loopFloor, 'l5', 'l1').map((c) => c.id)).toEqual(['l0', 'l1']);
  });
});

describe('allowedMoveValues', () => {
  it('excludes values that would land on an exit stair while hold is active', () => {
    const hold = createHoldState('lobby', { climb: 1 });
    const allowed = allowedMoveValues(
      loopBoard,
      { floorId: 'lobby', cellId: 'l0' },
      6,
      hold,
      true,
    );
    expect(allowed).toEqual([1, 2, 4, 5, 6]);
    expect(allowed).not.toContain(3);
  });

  it('allows landing on the stair when hold is off', () => {
    const allowed = allowedMoveValues(
      loopBoard,
      { floorId: 'lobby', cellId: 'l0' },
      6,
      null,
      false,
    );
    expect(allowed).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns no values when every roll would land on a held stair', () => {
    const oneStair = createBoard(
      [{
        id: 'f1',
        index: 0,
        label: 'Held',
        holdEnabled: true,
        cells: [{ id: 's', index: 0, kind: 'stair', stairId: 'up' }],
      }, {
        id: 'f2',
        index: 1,
        label: 'Next',
        cells: [{ id: 'n', index: 0 }],
      }],
      [{ id: 'up', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'n', legal: true }],
    );
    const hold = createHoldState('f1', { climb: 1 });
    const allowed = allowedMoveValues(
      oneStair,
      { floorId: 'f1', cellId: 's' },
      6,
      hold,
      true,
    );
    expect(allowed).toEqual([]);
    expect(sampleMoveValue(allowed, () => 0.5)).toBe(0);
  });
});

describe('sampleMoveValue', () => {
  it('picks from the allowed set with injected rng', () => {
    expect(sampleMoveValue([1, 2, 4], () => 0)).toBe(1);
    expect(sampleMoveValue([1, 2, 4], () => 0.999)).toBe(4);
  });
});
