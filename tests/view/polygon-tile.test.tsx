import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('PolygonTile render path', () => {
  it('uses meshInstances instead of the invalid type asset API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'components/board/PolygonTile.tsx'),
      'utf8',
    );
    expect(source).toMatch(/<Render meshInstances=\{\[meshInstance\]\} \/>/);
    expect(source).not.toMatch(/type="asset"/);
    expect(source).toMatch(/localPolygon/);
  });

  it('does not pass React onCreate or DOM test ids onto PlayCanvas Entity', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'components/board/PolygonTile.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/onCreate/);
    expect(source).not.toMatch(/data-testid/);
    expect(source).not.toMatch(/setMeshInstance\(null\)/);
  });
});
