import { hudWidgetLabel, hudWidgetOf } from '@/lib/designer/hud';
import type { Cell, HudWidget } from '@/lib/engine/types';

export const PREVIEW_TILE_COLORS = {
  corridor: { diffuse: '#94a3b8', emissive: '#475569' },
  stair: { diffuse: '#f59e0b', emissive: '#b45309' },
  room: { diffuse: '#14b8a6', emissive: '#0f766e' },
  door: { diffuse: '#818cf8', emissive: '#4338ca' },
  hud: { diffuse: '#a78bfa', emissive: '#5b21b6' },
  start: { diffuse: '#34d399', emissive: '#059669' },
  selected: { diffuse: '#38bdf8', emissive: '#0369a1' },
} as const;

export type TileChromeCell = Pick<Cell, 'kind' | 'start' | 'hudWidget'> & {
  hudWidget?: HudWidget;
};

export function designerCellLabel(cell: TileChromeCell): string {
  if (cell.start) return 'Start';
  if (cell.kind === 'stair') return 'Stair';
  if (cell.kind === 'room') return 'Room';
  if (cell.kind === 'door') return 'Door';
  if (cell.kind === 'hud') return hudWidgetLabel(hudWidgetOf(cell));
  return '';
}

export function previewTileColor(cell: TileChromeCell): { diffuse: string; emissive: string } {
  if (cell.start) return PREVIEW_TILE_COLORS.start;
  if (cell.kind === 'stair') return PREVIEW_TILE_COLORS.stair;
  if (cell.kind === 'room') return PREVIEW_TILE_COLORS.room;
  if (cell.kind === 'door') return PREVIEW_TILE_COLORS.door;
  if (cell.kind === 'hud') return PREVIEW_TILE_COLORS.hud;
  return PREVIEW_TILE_COLORS.corridor;
}

export function previewTileLabel(_cell?: TileChromeCell): null {
  return null;
}

export function tileActionKind(cell: TileChromeCell): string {
  if (cell.start) return 'Start';
  if (cell.kind === 'stair') return 'Stair';
  if (cell.kind === 'room') return 'Room';
  if (cell.kind === 'door') return 'Door';
  if (cell.kind === 'hud') return 'HUD';
  return 'Tile';
}
