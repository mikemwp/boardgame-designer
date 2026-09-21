import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CellInspector } from '@/components/designer/CellInspector';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addFloor, attachStair } from '@/lib/designer/mutate';

describe('CellInspector', () => {
  it('renames the floor, sets pack and start on a corridor', () => {
    const onRenameFloor = vi.fn();
    const onSetPack = vi.fn();
    const onSetStart = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={['climb']}
        onRenameFloor={onRenameFloor}
        onSetPack={onSetPack}
        onSetStart={onSetStart}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Floor name'), { target: { value: 'Lobby' } });
    fireEvent.blur(screen.getByLabelText('Floor name'));
    expect(onRenameFloor).toHaveBeenCalledWith('Lobby');
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    expect(onSetPack).toHaveBeenCalledWith('climb');
    fireEvent.click(screen.getByRole('button', { name: 'Start square' }));
    expect(onSetStart).toHaveBeenCalled();
  });

  it('links a dangling stair to another floor', () => {
    const onLinkStair = vi.fn();
    const two = addFloor(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'floor-1', 'Floor 1');
    const board = attachStair(two, 'ground', 'ground-c3');
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c3"
        packIds={['climb']}
        onRenameFloor={() => {}}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onAttachStair={() => {}}
        onLinkStair={onLinkStair}
        onClearStair={() => {}}
      />,
    );
    expect(screen.getByText('Stair squares never hold packs.')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Destination floor'), { target: { value: 'floor-1' } });
    fireEvent.change(screen.getByLabelText('Landing square'), { target: { value: 'floor-1-c0' } });
    expect(onLinkStair).toHaveBeenCalledWith('floor-1', 'floor-1-c0');
  });
});
