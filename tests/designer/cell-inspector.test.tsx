import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CellInspector } from '@/components/designer/CellInspector';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addFloor, attachRoom, attachStair, setStartCell } from '@/lib/designer/mutate';

describe('CellInspector', () => {
  it('labels the pane Tile Actions and sets pack and start on a corridor', () => {
    const onSetPack = vi.fn();
    const onSetStart = vi.fn();
    const onSetEnd = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={['climb']}
        onSetPack={onSetPack}
        onSetStart={onSetStart}
        onSetEnd={onSetEnd}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    expect(screen.getByText('Tile Actions')).toBeDefined();
    expect(screen.getByTestId('tile-actions-kind').textContent).toBe('Tile');
    expect(screen.queryByLabelText('Title')).toBeNull();
    expect(screen.queryByLabelText('Floor name')).toBeNull();
    expect(screen.queryByLabelText('Level name')).toBeNull();
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    expect(onSetPack).toHaveBeenCalledWith('climb');
    expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End tile' })).toBeNull();
    expect(onSetStart).not.toHaveBeenCalled();
    expect(onSetEnd).not.toHaveBeenCalled();
  });

  it('points empty packs at the Packs tab instead of Test import only', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={[]}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    expect(
      screen.getByText('No packs in this draft. Create a pack in Packs, or import a CSV in Test.'),
    ).toBeDefined();
  });

  it('labels end as stair or room from the selected cell', () => {
    const board = attachStair(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 'ground-c3');
    const hubBoard = createBoard(
      [createLoopedFloor('ground', 'Ground', 0, { kind: 'hub-spoke', hubTiles: 8, spokeCount: 4, spokeTiles: 2 })],
      [],
    );
    const hubCell = hubBoard.floors[0]!.cells.find((c) => c.region === 'hub')!;
    const { rerender } = render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c3"
        packIds={[]}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'End stair' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
    rerender(
      <CellInspector
        board={hubBoard}
        floorId="ground"
        cellId={hubCell.id}
        packIds={[]}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'End room' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End tile' })).toBeNull();
  });

  it('assigns a pack on a room and switches single vs multi', () => {
    const onSetPack = vi.fn();
    const onSetRoomMode = vi.fn();
    const onClear = vi.fn();
    const board = attachRoom(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 'ground-c3');
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c3"
        packIds={['notes']}
        onSetPack={onSetPack}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        onClear={onClear}
        onSetRoomMode={onSetRoomMode}
      />,
    );
    expect(screen.getByText('Room')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'End room' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End tile' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'notes' } });
    expect(onSetPack).toHaveBeenCalledWith('notes');
    fireEvent.click(screen.getByRole('button', { name: 'multi-tile' }));
    expect(onSetRoomMode).toHaveBeenCalledWith('multi');
    fireEvent.click(screen.getByRole('button', { name: 'single-tile' }));
    expect(onSetRoomMode).toHaveBeenCalledWith('single');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear' }).at(-1)!);
    expect(onClear).toHaveBeenCalled();
  });

  it('links a dangling stair to another level', () => {
    const onLinkStair = vi.fn();
    const two = addFloor(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'floor-1', 'Floor 1');
    const board = attachStair(two, 'ground', 'ground-c3');
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c3"
        packIds={['climb']}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={onLinkStair}
        onClearStair={() => {}}
      />,
    );
    expect(screen.getByText('Stair tiles never hold packs.')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Destination level'), { target: { value: 'floor-1' } });
    fireEvent.change(screen.getByLabelText('Landing tile'), { target: { value: 'floor-1-c0' } });
    expect(onLinkStair).toHaveBeenCalledWith('floor-1', 'floor-1-c0');
  });

  it('shows Audio on a corridor and not on HUD', () => {
    const onSetAudio = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const { rerender } = render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={['climb']}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        gameId="g1"
        onSetAudio={onSetAudio}
        onSetImage={() => {}}
        onSetVideo={() => {}}
        onSetFace={() => {}}
      />,
    );
    expect(screen.getByText('Audio')).toBeDefined();
    expect(screen.getByText('Image')).toBeDefined();
    expect(screen.getByText('Tile face')).toBeDefined();
    expect(screen.getByText('Land / HUD popup — not the 3D face.')).toBeDefined();
    expect(screen.getByText('Video')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Audio URL'), {
      target: { value: 'https://example.com/tile.mp3' },
    });
    fireEvent.blur(screen.getByLabelText('Audio URL'));
    expect(onSetAudio).toHaveBeenCalled();

    rerender(
      <CellInspector
        board={board}
        floorId="ground"
        cellId={hud.id}
        packIds={['climb']}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        gameId="g1"
        onSetAudio={onSetAudio}
      />,
    );
    expect(screen.queryByText('Audio')).toBeNull();
    expect(screen.queryByText('Image')).toBeNull();
    expect(screen.queryByText('Video')).toBeNull();
  });

  it('keeps Clear on the top row and confirms Clear', () => {
    const onClear = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={['climb']}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        onClear={onClear}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Make stair' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End tile' })).toBeNull();
    const clear = screen.getByRole('button', { name: 'Clear' });
    const header = screen.getByText('Tile Actions').parentElement!;
    expect(header.contains(clear)).toBe(true);
    fireEvent.click(clear);
    expect(screen.getByText('Clear this tile?')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('does not show Start or End on Tile Actions for a start tile', () => {
    const started = setStartCell(
      createBoard([createLoopedFloor('ground', 'Level 1', 0)], []),
      'ground',
      'ground-c1',
    );
    render(
      <CellInspector
        board={started}
        floorId="ground"
        cellId="ground-c1"
        packIds={[]}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End tile' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDefined();
  });

  it('sets HUD type on a HUD cell and hides pack controls', () => {
    const onSetHudWidget = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId={hud.id}
        packIds={['climb']}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        onSetHudWidget={onSetHudWidget}
      />,
    );
    expect(screen.getByText('HUD')).toBeDefined();
    expect(screen.queryByLabelText('Pack')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'dice' } });
    expect(onSetHudWidget).toHaveBeenCalledWith('dice');
  });
});
