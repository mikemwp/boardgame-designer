import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DesignerPalette } from '@/components/designer/DesignerPalette';

describe('DesignerPalette', () => {
  it('selects corridor from the palette', () => {
    const onToolChange = vi.fn();
    render(<DesignerPalette tool="select" onToolChange={onToolChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tile' }));
    expect(onToolChange).toHaveBeenCalledWith('corridor');
  });

  it('keeps tool names visible as button labels', () => {
    render(<DesignerPalette tool="select" onToolChange={() => {}} />);
    const labels = screen.getAllByRole('button').map((button) => button.textContent);
    expect(labels).toEqual([
      'Select',
      'Tile',
      'HUD',
      'Board',
      'Stair',
      'Room',
      'Door',
      'Start tile',
      'End tile',
      'Fill',
      'Erase',
      'Clear',
    ]);
  });

  it('places Start and End after Door and whites Start only when the cell is start', () => {
    const onSetStart = vi.fn();
    render(
      <DesignerPalette
        tool="select"
        onToolChange={() => {}}
        onSetStart={onSetStart}
        onSetEnd={() => {}}
        isStart
        startDisabled={false}
        endDisabled={false}
      />,
    );
    const labels = screen.getAllByRole('button').map((button) => button.textContent);
    expect(labels.indexOf('Door')).toBeLessThan(labels.indexOf('Start tile'));
    expect(labels.indexOf('Start tile')).toBeLessThan(labels.indexOf('End tile'));
    expect(labels.indexOf('End tile')).toBeLessThan(labels.indexOf('Fill'));
    expect(screen.getByRole('button', { name: 'Start tile' }).className).toMatch(/bg-secondary/);
    fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
    expect(onSetStart).toHaveBeenCalled();
  });

  it('disables Stair and Room in a room and Door on a level', () => {
    const { rerender } = render(<DesignerPalette tool="select" onToolChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Door' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Stair' })).toHaveProperty('disabled', false);
    rerender(<DesignerPalette tool="select" viewingRoom onToolChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Door' })).toHaveProperty('disabled', false);
    expect(screen.getByRole('button', { name: 'Stair' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Room' })).toHaveProperty('disabled', true);
  });
});
