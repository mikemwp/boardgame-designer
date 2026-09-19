import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseCardCsv } from '@/lib/import/spreadsheet';

describe('parseCardCsv', () => {
  it('imports header row with required pack and title', () => {
    const csv = readFileSync(path.join(__dirname, 'fixtures/valid.csv'), 'utf8');
    const { cards, errors } = parseCardCsv(csv);
    expect(errors).toHaveLength(0);
    expect(cards[0]).toMatchObject({ pack: 'climb', title: 'First Rung' });
  });

  it('skips rows missing required columns', () => {
    const csv = readFileSync(path.join(__dirname, 'fixtures/missing-title.csv'), 'utf8');
    const { cards, errors } = parseCardCsv(csv);
    expect(cards).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});
