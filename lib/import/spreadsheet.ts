import Papa from 'papaparse';
import type { Card } from '@/lib/engine/types';

export function parseCardCsv(text: string): { cards: Card[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const errors: string[] = [];
  const cards: Card[] = [];
  parsed.data.forEach((row, i) => {
    const pack = row.pack?.trim();
    const title = row.title?.trim();
    if (!pack || !title) {
      errors.push(`row ${i + 2}: pack and title required`);
      return;
    }
    cards.push({
      id: `${pack}-${i}`,
      pack,
      title,
      body: row.body?.trim() || undefined,
      tags: row.tags ? row.tags.split('|').map((t) => t.trim()) : undefined,
    });
  });
  return { cards, errors };
}
