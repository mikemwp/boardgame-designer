import { describe, it, expect } from 'vitest';
import {
  designerCellLabel,
  previewTileColor,
  previewTileLabel,
  PREVIEW_TILE_COLORS,
} from '@/lib/designer/tile-chrome';

describe('designerCellLabel', () => {
  it('labels Start, Stair, Room, Door, and HUD widgets', () => {
    expect(designerCellLabel({ kind: 'corridor', start: true })).toBe('Start');
    expect(designerCellLabel({ kind: 'stair' })).toBe('Stair');
    expect(designerCellLabel({ kind: 'room' })).toBe('Room');
    expect(designerCellLabel({ kind: 'door' })).toBe('Door');
    expect(designerCellLabel({ kind: 'hud' })).toBe('HUD');
    expect(designerCellLabel({ kind: 'hud', hudWidget: 'dice' })).toBe('Dice');
    expect(designerCellLabel({ kind: 'corridor' })).toBe('');
  });
});

describe('previewTileColor', () => {
  it('uses kind colors and Start green; never a text label', () => {
    expect(previewTileColor({ kind: 'corridor', start: true })).toEqual(PREVIEW_TILE_COLORS.start);
    expect(previewTileColor({ kind: 'stair' })).toEqual(PREVIEW_TILE_COLORS.stair);
    expect(previewTileColor({ kind: 'room' })).toEqual(PREVIEW_TILE_COLORS.room);
    expect(previewTileColor({ kind: 'door' })).toEqual(PREVIEW_TILE_COLORS.door);
    expect(previewTileColor({ kind: 'hud' })).toEqual(PREVIEW_TILE_COLORS.hud);
    expect(previewTileColor({ kind: 'corridor' })).toEqual(PREVIEW_TILE_COLORS.corridor);
    expect(previewTileLabel({ kind: 'stair', start: true })).toBeNull();
  });
});
