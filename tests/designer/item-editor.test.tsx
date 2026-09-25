import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ItemEditor } from '@/components/designer/ItemEditor';
import { memoryMediaStore } from '@/lib/library/media-store';

describe('ItemEditor', () => {
  it('creates and edits title, notes, and uses', () => {
    const onCreate = vi.fn();
    const onChange = vi.fn();
    render(
      <ItemEditor
        items={[{ id: 'item-1', name: 'Item 1', starting: false }]}
        selectedId="item-1"
        onSelect={() => {}}
        onCreate={onCreate}
        onChange={onChange}
        onDelete={() => {}}
        gameId="g1"
        media={memoryMediaStore()}
      />,
    );
    expect(screen.getByText('Items')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New item' }));
    expect(onCreate).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Lock pick' } });
    expect(onChange).toHaveBeenCalledWith({ name: 'Lock pick' });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Opens locks' } });
    expect(onChange).toHaveBeenCalledWith({ description: 'Opens locks' });
    fireEvent.change(screen.getByLabelText('Usage notes'), { target: { value: 'One door' } });
    expect(onChange).toHaveBeenCalledWith({ usageNotes: 'One door' });
    fireEvent.change(screen.getByLabelText('Uses remaining'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith({ usesRemaining: 2 });
  });
});
