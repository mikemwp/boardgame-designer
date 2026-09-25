import { describe, expect, it } from 'vitest';
import { decodeZip, encodeZip } from '@/lib/library/zip';

describe('encodeZip / decodeZip', () => {
  it('round-trips uncompressed files including a media path', () => {
    const files = {
      'game.json': new TextEncoder().encode('{"schemaVersion":1}'),
      'media/asset-1': new Uint8Array([10, 20, 30]),
    };
    const decoded = decodeZip(encodeZip(files));
    expect(Object.keys(decoded).sort()).toEqual(['game.json', 'media/asset-1']);
    expect(new TextDecoder().decode(decoded['game.json'])).toBe('{"schemaVersion":1}');
    expect(decoded['media/asset-1']).toEqual(new Uint8Array([10, 20, 30]));
  });
});
