import { hudWidgetLabel, hudWidgetOf } from '@/lib/designer/hud';
import type { Cell, HudWidget } from '@/lib/engine/types';

export const PREVIEW_TILE_COLORS = {
  corridor: { diffuse: '#94a3b8', emissive: '#475569' },
  stair: { diffuse: '#f59e0b', emissive: '#b45309' },
  room: { diffuse: '#14b8a6', emissive: '#0f766e' },
  hud: { diffuse: '#a78bfa', emissive: '#5b21b6' },
  board: { diffuse: '#a8a29e', emissive: '#57534e' },
  door: { diffuse: '#f472b6', emissive: '#9d174d' },
  start: { diffuse: '#34d399', emissive: '#059669' },
  end: { diffuse: '#fb7185', emissive: '#be123c' },
  pack: { diffuse: '#2563eb', emissive: '#1d4ed8' },
  card: { diffuse: '#d97706', emissive: '#b45309' },
  selected: { diffuse: '#38bdf8', emissive: '#0369a1' },
} as const;

export type TileChromeCell = Pick<Cell, 'kind' | 'start' | 'end' | 'hudWidget' | 'packId'> & {
  hudWidget?: HudWidget;
  packMode?: 'draw' | 'card';
  cardId?: string;
};

export function designerCellLabel(cell: TileChromeCell): string {
  if (cell.start) return 'Start';
  if (cell.end) return 'End';
  if (cell.kind === 'stair') return 'Stair';
  if (cell.kind === 'room') return 'Room';
  if (cell.kind === 'door') return 'Door';
  if (cell.kind === 'board') return 'Board';
  if (cell.kind === 'hud') return hudWidgetLabel(hudWidgetOf(cell));
  if (cell.packId) return cell.packMode === 'card' ? 'Card' : 'Pack';
  return '';
}

export type PreviewMaterialName =
  | 'selected'
  | 'start'
  | 'end'
  | 'hud'
  | 'stair'
  | 'room'
  | 'door'
  | 'board'
  | 'pack'
  | 'card'
  | 'corridor';

export function previewMaterialName(cell: TileChromeCell, selected = false): PreviewMaterialName {
  if (selected) return 'selected';
  const color = previewTileColor(cell);
  if (color === PREVIEW_TILE_COLORS.start) return 'start';
  if (color === PREVIEW_TILE_COLORS.end) return 'end';
  if (color === PREVIEW_TILE_COLORS.hud) return 'hud';
  if (color === PREVIEW_TILE_COLORS.stair) return 'stair';
  if (color === PREVIEW_TILE_COLORS.room) return 'room';
  if (color === PREVIEW_TILE_COLORS.door) return 'door';
  if (color === PREVIEW_TILE_COLORS.board) return 'board';
  if (color === PREVIEW_TILE_COLORS.pack) return 'pack';
  if (color === PREVIEW_TILE_COLORS.card) return 'card';
  return 'corridor';
}

export function previewTileColor(cell: TileChromeCell): { diffuse: string; emissive: string } {
  if (cell.start) return PREVIEW_TILE_COLORS.start;
  if (cell.end) return PREVIEW_TILE_COLORS.end;
  if (cell.kind === 'stair') return PREVIEW_TILE_COLORS.stair;
  if (cell.kind === 'room') return PREVIEW_TILE_COLORS.room;
  if (cell.kind === 'door') return PREVIEW_TILE_COLORS.door;
  if (cell.kind === 'board') return PREVIEW_TILE_COLORS.board;
  if (cell.kind === 'hud') return PREVIEW_TILE_COLORS.hud;
  if (cell.packId) return cell.packMode === 'card' ? PREVIEW_TILE_COLORS.card : PREVIEW_TILE_COLORS.pack;
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
  if (cell.kind === 'board') return 'Board';
  if (cell.kind === 'hud') return 'HUD';
  return 'Tile';
}
