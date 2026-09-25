import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BoardEditor } from '@/components/designer/BoardEditor';
import { defaultFloorLook } from '@/lib/designer/board-look';

describe('BoardEditor', () => {
  it('edits board image, edge, surround, castle, spout, and camera', () => {
    const onChange = vi.fn();
    render(
      <BoardEditor
        look={defaultFloorLook()}
        gameTitle="Haunted House"
        gameId="g1"
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Haunted House')).toBeDefined();
    expect(screen.getByText('Board image')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Edge'), { target: { value: 'metal' } });
    expect(onChange).toHaveBeenCalledWith({ edge: expect.objectContaining({ material: 'metal' }) });
    fireEvent.change(screen.getByLabelText('Centre mesh'), { target: { value: 'castle' } });
    expect(onChange).toHaveBeenCalledWith({
      centreMesh: expect.objectContaining({ kind: 'castle' }),
    });
    fireEvent.change(screen.getByLabelText('Popup spout'), { target: { value: 'mesh' } });
    expect(onChange).toHaveBeenCalledWith({ popupSpout: 'mesh' });
    fireEvent.change(screen.getByLabelText('Camera'), { target: { value: 'token-side' } });
    expect(onChange).toHaveBeenCalledWith({ cameraBias: 'token-side' });
  });
});
