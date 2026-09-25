import { describe, it, expect } from 'vitest';
import { landMediaOf, landPopupSpout, shouldShowLandMedia } from '@/lib/view/land-media';

describe('land media', () => {
  it('shows image/video as HUD media and ignores empty cells', () => {
    const image = { id: 'i1', name: 'tile.png', source: 'url' as const, src: 'https://ex/tile.png' };
    expect(landMediaOf({ image })).toEqual({ image });
    expect(landMediaOf({})).toBeNull();
    expect(shouldShowLandMedia({ tokenSliding: true, cell: { image } })).toBe(false);
    expect(shouldShowLandMedia({ tokenSliding: false, awaitingRoom: true, cell: { image } })).toBe(false);
    expect(shouldShowLandMedia({ tokenSliding: false, cell: { image } })).toBe(true);
    expect(landPopupSpout({ popupSpout: 'mesh' })).toBe('mesh');
    expect(landPopupSpout(undefined)).toBe('tile');
  });
});
