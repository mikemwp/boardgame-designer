import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CellInspector } from '@/components/designer/CellInspector';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addFloor, attachStair, placeDoor, placeRoom } from '@/lib/designer/mutate';

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
    expect(screen.queryByLabelText('Floor name')).toBeNull();
    expect(screen.queryByLabelText('Level name')).toBeNull();
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    expect(onSetPack).toHaveBeenCalledWith('climb');
    fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
    expect(onSetStart).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'End tile' }));
    expect(onSetEnd).toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: 'End stair' })).toBeDefined();
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
    expect(screen.getByRole('button', { name: 'End room' })).toBeDefined();
  });

  it('assigns a pack on a room and explains door landings', () => {
    const onSetPack = vi.fn();
    const onClearDoor = vi.fn();
    let board = placeRoom(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 1, 1, 'ground-room');
    const neighbor = board.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    board = placeDoor(board, 'ground', neighbor.id);
    const { rerender } = render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-room"
        packIds={['notes']}
        onSetPack={onSetPack}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        onClearDoor={onClearDoor}
      />,
    );
    expect(screen.getByText('Room')).toBeDefined();
    expect(screen.getByRole('button', { name: 'End room' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Make stair' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'notes' } });
    expect(onSetPack).toHaveBeenCalledWith('notes');

    rerender(
      <CellInspector
        board={board}
        floorId="ground"
        cellId={neighbor.id}
        packIds={['notes']}
        onSetPack={onSetPack}
        onSetStart={() => {}}
        onSetEnd={() => {}}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
        onClearDoor={onClearDoor}
      />,
    );
    expect(screen.getByText('Door')).toBeDefined();
    expect(screen.getByText("Landing here deals the adjacent room's pack.")).toBeDefined();
    expect(screen.getByText('Room audio plays on this door.')).toBeDefined();
    expect(screen.queryByLabelText('Pack')).toBeNull();
    expect(screen.queryByText('Audio')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Convert to tile' }));
    expect(onClearDoor).toHaveBeenCalled();
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

  it('shows Audio on a corridor and not on HUD or door', () => {
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
      />,
    );
    expect(screen.getByText('Audio')).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('https://…'), {
      target: { value: 'https://example.com/tile.mp3' },
    });
    fireEvent.blur(screen.getByPlaceholderText('https://…'));
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
    fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'dice' } });
    expect(onSetHudWidget).toHaveBeenCalledWith('dice');
  });
});
