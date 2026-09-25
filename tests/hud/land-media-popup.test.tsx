import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LandMediaPopup } from '@/components/hud/LandMediaPopup';

describe('LandMediaPopup', () => {
  it('shows land image from the spout and closes', () => {
    const onClose = vi.fn();
    render(
      <LandMediaPopup
        image={{ id: 'i1', name: 'tile.png', source: 'url', src: 'https://ex/tile.png' }}
        spout="mesh"
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('land-media-popup').getAttribute('data-spout')).toBe('mesh');
    expect(screen.getByAltText('tile.png')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
