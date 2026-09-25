import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SpinnerEditor } from '@/components/designer/SpinnerEditor';
import { createSpinner } from '@/lib/designer/spinners';

describe('SpinnerEditor Preview', () => {
  it('disables Preview when no spinner is selected', () => {
    render(
      <SpinnerEditor
        spinners={[]}
        selectedId={null}
        onSelect={() => {}}
        onCreate={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSplit={() => {}}
        onLinked={() => {}}
        onAddSegment={() => {}}
        onRemoveSegment={() => {}}
        onSegmentLabel={() => {}}
        onSegmentPercent={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveProperty('disabled', true);
  });

  it('enables Preview for the selected spinner and calls onPreview', () => {
    const onPreview = vi.fn();
    const spinners = createSpinner([], 'spinner-1');
    render(
      <SpinnerEditor
        spinners={spinners}
        selectedId="spinner-1"
        onSelect={() => {}}
        onCreate={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSplit={() => {}}
        onLinked={() => {}}
        onAddSegment={() => {}}
        onRemoveSegment={() => {}}
        onSegmentLabel={() => {}}
        onSegmentPercent={() => {}}
        onPreview={onPreview}
      />,
    );
    const preview = screen.getByRole('button', { name: 'Preview' });
    expect(preview).toHaveProperty('disabled', false);
    fireEvent.click(preview);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
