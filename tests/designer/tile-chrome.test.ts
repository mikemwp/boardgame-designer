import { describe, it, expect } from 'vitest';
import {
  designerCellLabel,
  previewMaterialName,
  previewTileColor,
  previewTileLabel,
  PREVIEW_TILE_COLORS,
} from '@/lib/designer/tile-chrome';

describe('designerCellLabel', () => {
  it('labels Start, Stair, Room, Door, Board, and HUD widgets', () => {
    expect(designerCellLabel({ kind: 'corridor', start: true })).toBe('Start');
    expect(designerCellLabel({ kind: 'stair' })).toBe('Stair');
    expect(designerCellLabel({ kind: 'room' })).toBe('Room');
    expect(designerCellLabel({ kind: 'door' })).toBe('Door');
    expect(designerCellLabel({ kind: 'board' })).toBe('Board');
    expect(designerCellLabel({ kind: 'hud' })).toBe('HUD');
    expect(designerCellLabel({ kind: 'hud', hudWidget: 'dice' })).toBe('Dice');
    expect(designerCellLabel({ kind: 'corridor', end: true })).toBe('End');
    expect(designerCellLabel({ kind: 'corridor', packId: 'climb', packMode: 'draw' })).toBe('Pack');
    expect(designerCellLabel({ kind: 'corridor', packId: 'climb', packMode: 'card', cardId: 'c1' })).toBe(
      'Card',
    );
    expect(designerCellLabel({ kind: 'corridor' })).toBe('');
  });
});

describe('previewTileColor', () => {
  it('uses kind colors including Board and Door; no 3D text labels', () => {
    expect(previewTileColor({ kind: 'corridor', start: true })).toEqual(PREVIEW_TILE_COLORS.start);
    expect(previewTileColor({ kind: 'stair' })).toEqual(PREVIEW_TILE_COLORS.stair);
    expect(previewTileColor({ kind: 'room' })).toEqual(PREVIEW_TILE_COLORS.room);
    expect(previewTileColor({ kind: 'door' })).toEqual(PREVIEW_TILE_COLORS.door);
    expect(previewTileColor({ kind: 'board' })).toEqual(PREVIEW_TILE_COLORS.board);
    expect(previewTileColor({ kind: 'hud' })).toEqual(PREVIEW_TILE_COLORS.hud);
    expect(previewTileColor({ kind: 'corridor' })).toEqual(PREVIEW_TILE_COLORS.corridor);
    expect(previewTileColor({ kind: 'corridor', end: true })).toEqual(PREVIEW_TILE_COLORS.end);
    expect(previewTileColor({ kind: 'corridor', packId: 'climb', packMode: 'draw' })).toEqual(
      PREVIEW_TILE_COLORS.pack,
    );
    expect(previewTileColor({ kind: 'corridor', packId: 'climb', packMode: 'card' })).toEqual(
      PREVIEW_TILE_COLORS.card,
    );
    expect(previewTileLabel({ kind: 'stair', start: true })).toBeNull();
    expect(previewMaterialName({ kind: 'board' })).toBe('board');
    expect(previewMaterialName({ kind: 'door' })).toBe('door');
    expect(previewMaterialName({ kind: 'corridor', end: true })).toBe('end');
    expect(previewMaterialName({ kind: 'corridor', packId: 'p', packMode: 'draw' })).toBe('pack');
    expect(previewMaterialName({ kind: 'corridor', packId: 'p', packMode: 'card' })).toBe('card');
    expect(previewMaterialName({ kind: 'corridor' })).toBe('corridor');
    expect(previewMaterialName({ kind: 'board' }, true)).toBe('selected');
  });
});
