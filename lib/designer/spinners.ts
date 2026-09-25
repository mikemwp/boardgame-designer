import type { Board } from '@/lib/engine/board';
import { sampleSegment } from '@/lib/engine/spinner';
import type { Card, SpinnerDef, SpinnerSegment, SpinnerSplit } from '@/lib/engine/types';

export { sampleSegment };

export function nextSpinnerId(existing: SpinnerDef[]): string {
  let n = 1;
  const used = new Set(existing.map((spinner) => spinner.id));
  while (used.has(`spinner-${n}`)) n += 1;
  return `spinner-${n}`;
}

function nextSegmentId(spinnerId: string, segments: SpinnerSegment[]): string {
  let n = 1;
  const used = new Set(segments.map((segment) => segment.id));
  while (used.has(`${spinnerId}-s${n}`)) n += 1;
  return `${spinnerId}-s${n}`;
}

export function createSpinner(list: SpinnerDef[], id: string): SpinnerDef[] {
  const trimmed = id.trim();
  if (!trimmed || list.some((spinner) => spinner.id === trimmed)) return list;
  const n = list.length + 1;
  const spinner: SpinnerDef = {
    id: trimmed,
    name: `Spinner ${n}`,
    split: 'equal',
    linked: false,
    template: 'classic',
    segments: [
      { id: `${trimmed}-s1`, label: 'Segment 1' },
      { id: `${trimmed}-s2`, label: 'Segment 2' },
    ],
  };
  return [...list, spinner];
}

export function updateSpinner(
  list: SpinnerDef[],
  id: string,
  patch: Partial<Pick<SpinnerDef, 'name' | 'split' | 'segments' | 'linked' | 'template' | 'image' | 'audio'>>,
): SpinnerDef[] {
  return list.map((spinner) => {
    if (spinner.id !== id) return spinner;
    const next: SpinnerDef = { ...spinner };
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return spinner;
      next.name = name;
    }
    if (patch.split !== undefined) next.split = patch.split;
    if (patch.linked !== undefined) next.linked = patch.linked;
    if (patch.segments !== undefined) next.segments = patch.segments;
    if (patch.template !== undefined) next.template = patch.template;
    if ('image' in patch) {
      if (patch.image) next.image = patch.image;
      else delete next.image;
    }
    if ('audio' in patch) {
      if (patch.audio) next.audio = patch.audio;
      else delete next.audio;
    }
    return next;
  });
}

export function renameSpinner(list: SpinnerDef[], id: string, name: string): SpinnerDef[] {
  return updateSpinner(list, id, { name });
}

export function deleteSpinner(list: SpinnerDef[], id: string): SpinnerDef[] {
  return list.filter((spinner) => spinner.id !== id);
}

export function addSegment(list: SpinnerDef[], spinnerId: string): SpinnerDef[] {
  return list.map((spinner) => {
    if (spinner.id !== spinnerId) return spinner;
    const id = nextSegmentId(spinner.id, spinner.segments);
    return {
      ...spinner,
      segments: [...spinner.segments, { id, label: `Segment ${spinner.segments.length + 1}` }],
    };
  });
}

export function removeSegment(list: SpinnerDef[], spinnerId: string, segmentId: string): SpinnerDef[] {
  return list.map((spinner) => {
    if (spinner.id !== spinnerId) return spinner;
    if (spinner.segments.length <= 2) return spinner;
    const segments = spinner.segments.filter((segment) => segment.id !== segmentId);
    if (segments.length < 2) return spinner;
    return { ...spinner, segments };
  });
}

export function setSegmentLabel(
  list: SpinnerDef[],
  spinnerId: string,
  segmentId: string,
  label: string,
): SpinnerDef[] {
  const trimmed = label.trim();
  if (!trimmed) return list;
  return list.map((spinner) => {
    if (spinner.id !== spinnerId) return spinner;
    return {
      ...spinner,
      segments: spinner.segments.map((segment) =>
        segment.id === segmentId ? { ...segment, label: trimmed } : segment,
      ),
    };
  });
}

export function setSegmentPercent(
  list: SpinnerDef[],
  spinnerId: string,
  segmentId: string,
  percent: number,
): SpinnerDef[] {
  const value = Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.floor(percent))) : 0;
  return list.map((spinner) => {
    if (spinner.id !== spinnerId) return spinner;
    return {
      ...spinner,
      segments: spinner.segments.map((segment) =>
        segment.id === segmentId ? { ...segment, percent: value } : segment,
      ),
    };
  });
}

export function setSegmentCount(list: SpinnerDef[], spinnerId: string, count: number): SpinnerDef[] {
  const n = Math.max(2, Math.floor(count));
  return list.map((spinner) => {
    if (spinner.id !== spinnerId) return spinner;
    if (spinner.segments.length === n) return spinner;
    if (n < spinner.segments.length) {
      return { ...spinner, segments: spinner.segments.slice(0, n) };
    }
    const extra = [...spinner.segments];
    while (extra.length < n) {
      const id = nextSegmentId(spinner.id, extra);
      extra.push({ id, label: `Segment ${extra.length + 1}` });
    }
    return { ...spinner, segments: extra };
  });
}

export function setSplit(list: SpinnerDef[], spinnerId: string, split: SpinnerSplit): SpinnerDef[] {
  return updateSpinner(list, spinnerId, { split });
}

export function percentTotal(segments: SpinnerSegment[]): number {
  return segments.reduce((sum, segment) => sum + (segment.percent ?? 0), 0);
}

export function percentsValid(spinner: SpinnerDef): boolean {
  if (spinner.split !== 'percent') return true;
  return percentTotal(spinner.segments) === 100;
}

export function rewriteSpinnerId<T extends { spinnerId?: string }>(
  value: T,
  from: string,
  to: string | undefined,
): T {
  if (value.spinnerId !== from) return value;
  if (to === undefined) {
    const { spinnerId: _drop, ...rest } = value;
    return rest as T;
  }
  return { ...value, spinnerId: to };
}

export function rewriteSpinnerRefs(
  board: Board,
  cards: Card[],
  from: string,
  to: string | undefined,
): { board: Board; cards: Card[] } {
  return {
    board: {
      ...board,
      floors: board.floors.map((floor) => ({
        ...floor,
        cells: floor.cells.map((cell) => rewriteSpinnerId(cell, from, to)),
      })),
    },
    cards: cards.map((card) => rewriteSpinnerId(card, from, to)),
  };
}
