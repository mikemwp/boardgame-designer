import { describe, it, expect } from 'vitest';
import { createGame, dispatch } from '@/lib/engine/game';
import { createLoopedFloor } from '@/lib/engine/layout';
import { emptyBootstrap, EMPTY_LABEL } from '@/lib/samples/empty';

describe('emptyBootstrap', () => {
  it('is labeled as an empty board, not Climb', () => {
    expect(EMPTY_LABEL).toBe('Empty board');
    const boot = emptyBootstrap();
    expect(boot.board.floors).toHaveLength(1);
    expect(boot.board.floors[0]?.id).toBe('ground');
    expect(boot.board.floors[0]?.label).toBe('Ground');
    expect(boot.board.floors[0]?.cells).toHaveLength(28);
    expect(boot.board.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 8 });
    expect(boot.board.stairs).toHaveLength(0);
    expect(boot.cards.deck).toHaveLength(0);
    expect(boot.players.players[0]?.token).toEqual({
      floorId: 'ground',
      cellId: 'ground-c0',
    });
  });

  it('loops without packs so a roll moves and does not deal', () => {
    const game = createGame(emptyBootstrap(), { rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(1);
    expect(next.players.players[0]?.token.cellId).toBe('ground-c1');
    expect(next.cards.currentCard).toBeNull();
  });

  it('does not share mutable board identity across calls', () => {
    const a = emptyBootstrap();
    const b = emptyBootstrap();
    a.board.floors[0]!.label = 'Mutated';
    expect(b.board.floors[0]!.label).toBe('Ground');
  });

  it('bakes grid coordinates outside the HUD without defaulting a start tile', () => {
    const boot = emptyBootstrap();
    const floor = boot.board.floors[0]!;
    const template = createLoopedFloor('ground', 'Ground', 0);
    expect(floor.columns).toBe(10);
    expect(floor.cells.some((c) => c.start)).toBe(false);
    expect(floor.cells.map((c) => ({ col: c.col, row: c.row }))).toEqual(
      template.cells.map((c) => ({ col: c.col, row: c.row })),
    );
  });
});
