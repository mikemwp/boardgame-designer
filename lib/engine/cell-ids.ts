import type { Cell } from '@/lib/engine/types';

export function uniquifyCellIds(floorId: string, cells: Cell[]): Cell[] {
  const used = new Set<string>();
  let i = 0;
  const nextUnused = () => {
    while (used.has(`${floorId}-c${i}`)) i += 1;
    const id = `${floorId}-c${i}`;
    used.add(id);
    i += 1;
    return id;
  };
  return cells.map((cell) => {
    if (cell.id && !used.has(cell.id)) {
      used.add(cell.id);
      return cell;
    }
    return { ...cell, id: nextUnused() };
  });
}

export function cellIdsAreUnique(cells: Array<{ id: string }>): boolean {
  const ids = cells.map((cell) => cell.id);
  return new Set(ids).size === ids.length;
}
