import { describe, it, expect } from 'vitest';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';
import { createGame, dispatch } from '@/lib/engine/game';

describe('climb sample', () => {
  it('is labeled as bundled sample only', () => {
    expect(CLIMB_LABEL).toContain('sample');
  });

  it('provides three looping floors of eight cells on a square ring', () => {
    expect(climbSample.board.floors).toHaveLength(3);
    for (const floor of climbSample.board.floors) {
      expect(floor.cells).toHaveLength(8);
    }
  });

  it('does not put packs on stair cells', () => {
    for (const floor of climbSample.board.floors) {
      for (const cell of floor.cells) {
        if (cell.kind === 'stair') {
          expect(cell.packId).toBeUndefined();
          expect(cell.stairId).toBeTruthy();
        }
      }
    }
  });

  it('has no bypass illegal stair from lobby to floor 2', () => {
    expect(climbSample.board.stairs.some((s) => s.id === 's0-bypass')).toBe(false);
  });

  it('starts with one climb pass for the climber', () => {
    const game = createGame(climbSample);
    expect(game.players.players[0]?.passesLeftByPack).toEqual({ climb: 1 });
  });

  it('does not deal a card until a content square is landed', () => {
    const game = createGame(climbSample);
    expect(game.cards.currentCard).toBeNull();
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll).not.toBeNull();
  });

  it('bakes a start square on lobby-c0 and grid coords on every cell', () => {
    const lobby = climbSample.board.floors[0]!;
    expect(lobby.cells[0]?.id).toBe('lobby-c0');
    expect(lobby.cells[0]?.start).toBe(true);
    expect(lobby.columns).toBe(8);
    for (const floor of climbSample.board.floors) {
      expect(floor.hud).toEqual({ col: 2, row: 2, width: 4, height: 2 });
      for (const cell of floor.cells) {
        expect(typeof cell.col).toBe('number');
        expect(typeof cell.row).toBe('number');
      }
    }
    expect(climbSample.board.floors[1]?.cells.some((c) => c.start)).toBe(false);
  });
});
