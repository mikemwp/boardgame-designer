import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DesignerPalette } from '@/components/designer/DesignerPalette';

describe('DesignerPalette', () => {
  it('selects corridor from the palette', () => {
    const onToolChange = vi.fn();
    render(<DesignerPalette tool="select" onToolChange={onToolChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corridor square' }));
    expect(onToolChange).toHaveBeenCalledWith('corridor');
  });

  it('keeps tool names visible as button labels', () => {
    render(<DesignerPalette tool="select" onToolChange={() => {}} />);
    for (const name of ['Select', 'Corridor square', 'Stair', 'Erase']) {
      expect(screen.getByRole('button', { name })).toBeDefined();
    }
  });
});
