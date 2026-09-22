import type { HudWidget } from '@/lib/engine/types';

export const HUD_WIDGETS: HudWidget[] = ['empty', 'dice', 'spinner', 'last-roll', 'player-bar'];

const HUD_WIDGET_LABELS: Record<HudWidget, string> = {
  empty: 'HUD',
  dice: 'Dice',
  spinner: 'Spin',
  'last-roll': 'Roll',
  'player-bar': 'Players',
};

export function hudWidgetOf(cell: { kind?: string; hudWidget?: HudWidget }): HudWidget {
  if (cell.kind !== 'hud' || !cell.hudWidget) return 'empty';
  return cell.hudWidget;
}

export function hudWidgetLabel(widget: HudWidget): string {
  return HUD_WIDGET_LABELS[widget];
}

export function listHudWidgets(board: {
  floors: Array<{ cells: Array<{ kind?: string; hudWidget?: HudWidget }> }>;
}): HudWidget[] {
  const seen = new Set<HudWidget>();
  for (const floor of board.floors) {
    for (const cell of floor.cells) {
      if (cell.kind !== 'hud') continue;
      seen.add(hudWidgetOf(cell));
    }
  }
  return HUD_WIDGETS.filter((widget) => seen.has(widget));
}

export function preferredMovementViz(
  board: { floors: Array<{ cells: Array<{ kind?: string; hudWidget?: HudWidget }> }> },
  fallback: 'dice' | 'spinner',
): 'dice' | 'spinner' {
  const widgets = listHudWidgets(board);
  const hasDice = widgets.includes('dice');
  const hasSpinner = widgets.includes('spinner');
  if (hasSpinner && !hasDice) return 'spinner';
  if (hasDice && !hasSpinner) return 'dice';
  return fallback;
}
