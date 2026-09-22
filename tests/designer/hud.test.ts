import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import {
  HUD_WIDGETS,
  hudWidgetLabel,
  hudWidgetOf,
  listHudWidgets,
  preferredMovementViz,
} from '@/lib/designer/hud';

describe('hud widgets', () => {
  it('labels the five HUD types', () => {
    expect(HUD_WIDGETS).toEqual(['empty', 'dice', 'spinner', 'last-roll', 'player-bar']);
    expect(hudWidgetLabel('empty')).toBe('HUD');
    expect(hudWidgetLabel('dice')).toBe('Dice');
    expect(hudWidgetLabel('spinner')).toBe('Spin');
    expect(hudWidgetLabel('last-roll')).toBe('Roll');
    expect(hudWidgetLabel('player-bar')).toBe('Players');
    expect(hudWidgetOf({ kind: 'corridor', hudWidget: 'dice' })).toBe('empty');
    expect(hudWidgetOf({ kind: 'hud' })).toBe('empty');
    expect(hudWidgetOf({ kind: 'hud', hudWidget: 'spinner' })).toBe('spinner');
  });

  it('picks movement viz when exactly one of dice or spinner is placed', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    expect(preferredMovementViz(board, 'dice')).toBe('dice');
    const withSpin = {
      ...board,
      floors: board.floors.map((f) => ({
        ...f,
        cells: f.cells.map((c) => (c.id === hud.id ? { ...c, hudWidget: 'spinner' as const } : c)),
      })),
    };
    expect(listHudWidgets(withSpin)).toEqual(expect.arrayContaining(['spinner', 'empty']));
    expect(preferredMovementViz(withSpin, 'dice')).toBe('spinner');
  });
});
