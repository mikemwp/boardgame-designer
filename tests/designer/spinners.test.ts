import { describe, it, expect } from 'vitest';
import {
  addSegment,
  createSpinner,
  deleteSpinner,
  nextSpinnerId,
  percentTotal,
  percentsValid,
  removeSegment,
  renameSpinner,
  sampleSegment,
  setSegmentCount,
  updateSpinner,
} from '@/lib/designer/spinners';

describe('spinner catalog', () => {
  it('creates an equal two-segment spinner and samples uniformly', () => {
    expect(nextSpinnerId([])).toBe('spinner-1');
    const created = createSpinner([], 'spinner-1');
    expect(created[0]).toMatchObject({
      id: 'spinner-1',
      name: 'Spinner 1',
      split: 'equal',
      linked: false,
      template: 'classic',
    });
    expect(created[0]?.segments).toHaveLength(2);
    const spin = sampleSegment(created[0]!, () => 0);
    expect(spin?.label).toBe('Segment 1');
    expect(sampleSegment(created[0]!, () => 0.99)?.label).toBe('Segment 2');
  });

  it('uses percent weights when split is percent', () => {
    let list = createSpinner([], 'spinner-1');
    list = updateSpinner(list, 'spinner-1', {
      split: 'percent',
      segments: [
        { id: 'a', label: 'Me', percent: 10 },
        { id: 'b', label: 'Partner', percent: 90 },
      ],
    });
    expect(percentTotal(list[0]!.segments)).toBe(100);
    expect(percentsValid(list[0]!)).toBe(true);
    expect(sampleSegment(list[0]!, () => 0.05)?.label).toBe('Me');
    expect(sampleSegment(list[0]!, () => 0.2)?.label).toBe('Partner');
  });

  it('adds and removes segments, keeping at least two', () => {
    let list = createSpinner([], 'spinner-1');
    list = addSegment(list, 'spinner-1');
    expect(list[0]?.segments).toHaveLength(3);
    const extraId = list[0]!.segments[2]!.id;
    list = removeSegment(list, 'spinner-1', extraId);
    expect(list[0]?.segments).toHaveLength(2);
    const keep = list[0]!.segments.map((s) => s.id);
    list = removeSegment(list, 'spinner-1', keep[0]!);
    expect(list[0]?.segments.map((s) => s.id)).toEqual(keep);
  });

  it('sets template and segment count', () => {
    const created = createSpinner([], 'spinner-1');
    const counted = setSegmentCount(created, 'spinner-1', 4);
    expect(counted[0]?.segments).toHaveLength(4);
    const styled = updateSpinner(counted, 'spinner-1', { template: 'wood' });
    expect(styled[0]?.template).toBe('wood');
  });

  it('renames and deletes a spinner', () => {
    const created = createSpinner([], 'spinner-1');
    const renamed = renameSpinner(created, 'spinner-1', 'Direction');
    expect(renamed[0]?.name).toBe('Direction');
    expect(deleteSpinner(renamed, 'spinner-1')).toEqual([]);
  });
});
