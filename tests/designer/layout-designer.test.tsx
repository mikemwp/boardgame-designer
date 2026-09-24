import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import { createBoard } from '@/lib/engine/board';
import type { Board } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';

vi.mock('@/components/board/FloorPreview', () => ({
  FloorPreview: () => <div data-testid="floor-preview" />,
}));

describe('LayoutDesigner', () => {
  it('keeps designer labels visible and exposes board shape', () => {
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Shape')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tile' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Select' })).toBeDefined();
  });

  it('centers board shape on the canvas top row and keeps tools in the bottom pane', () => {
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    const toolbar = screen.getByTestId('designer-toolbar');
    expect(toolbar.contains(screen.getByLabelText('Shape'))).toBe(true);
    expect(toolbar.contains(screen.getByLabelText('Tiles'))).toBe(true);
    expect(toolbar.className).toMatch(/justify-center/);
    expect(toolbar.contains(screen.getByRole('button', { name: 'Ground' }))).toBe(false);
    expect(toolbar.contains(screen.getByRole('button', { name: 'Select' }))).toBe(false);
    expect(toolbar.contains(screen.getByLabelText('Level name'))).toBe(false);
    const bottom = screen.getByTestId('designer-bottom-pane');
    expect(bottom.contains(screen.getByRole('button', { name: 'Ground' }))).toBe(true);
    expect(bottom.contains(screen.getByRole('button', { name: 'Select' }))).toBe(true);
    expect(bottom.contains(screen.getByLabelText('Level name'))).toBe(true);
    expect(screen.getByTestId('designer-bottom-row-blank')).toBeDefined();
    expect(screen.getByTestId('designer-saved-location').textContent).toBe('This device');
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDefined();
    expect(screen.getByTestId('designer-palette').className).toMatch(/flex-nowrap/);
    expect(screen.getByTestId('board-shape-fields').className).toMatch(/flex-nowrap/);
  });

  it('splits the canvas 2/3 and stretches the right pane without an inline preview', () => {
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    const { container } = render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    const split = container.firstElementChild as HTMLElement;
    expect(split.className).toMatch(/2fr_1fr/);
    expect(split.className).not.toMatch(/3fr_2fr/);
    expect(split.className).not.toMatch(/minmax\(20rem/);
    expect(screen.queryByTestId('preview-pane')).toBeNull();
    expect(screen.queryByTestId('floor-preview')).toBeNull();
    const tileActions = screen.getByTestId('tile-actions-pane');
    expect(tileActions.className).toMatch(/flex-1/);
    expect(tileActions.className).not.toMatch(/shrink-0/);
    expect(tileActions.className).not.toMatch(/h-64/);
    expect(tileActions.className).not.toMatch(/max-h-\[40%\]/);
  });

  it('adds Level 2+ and keeps Level 1 after deleting later levels', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const onBoardChange = vi.fn();
    const onSelectFloor = vi.fn();
    const { rerender } = render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={onSelectFloor}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add level' }));
    const withTwo = onBoardChange.mock.calls.at(-1)[0];
    expect(withTwo.floors.map((f: { label: string }) => f.label)).toEqual(['Level 1', 'Level 2']);
    rerender(
      <LayoutDesigner
        board={withTwo}
        cards={[]}
        selectedFloorId="floor-1"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={onSelectFloor}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add level' }));
    const withThree = onBoardChange.mock.calls.at(-1)[0];
    expect(withThree.floors.map((f: { label: string }) => f.label)).toEqual([
      'Level 1',
      'Level 2',
      'Level 3',
    ]);
    rerender(
      <LayoutDesigner
        board={withThree}
        cards={[]}
        selectedFloorId="floor-2"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={onSelectFloor}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Level 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete level' }));
    const afterFirstDelete = onBoardChange.mock.calls.at(-1)[0];
    expect(afterFirstDelete.floors.map((f: { id: string; label: string }) => f.label)).toEqual([
      'Level 1',
      'Level 2',
    ]);
    expect(onSelectFloor).toHaveBeenLastCalledWith('floor-1');
    rerender(
      <LayoutDesigner
        board={afterFirstDelete}
        cards={[]}
        selectedFloorId="floor-1"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={onSelectFloor}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Level 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete level' }));
    const afterSecondDelete = onBoardChange.mock.calls.at(-1)[0];
    expect(afterSecondDelete.floors.map((f: { label: string }) => f.label)).toEqual(['Level 1']);
    expect(afterSecondDelete.floors[0].id).toBe('ground');
  });

  it('places a corridor on an empty slot with the corridor tool', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="corridor"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-1-1'));
    expect(onBoardChange).toHaveBeenCalled();
    const next = onBoardChange.mock.calls[0][0];
    expect(next.floors[0].cells.some((c: { col?: number; row?: number }) => c.col === 1 && c.row === 1)).toBe(true);
  });

  it('erase of a HUD tile then Tile places a corridor on that square', () => {
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const { rerender } = render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="erase"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    const onBoardChange = vi.fn();
    rerender(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="erase"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId(`slot-${hud.col}-${hud.row}`));
    expect(onBoardChange).toHaveBeenCalled();
    const erased = onBoardChange.mock.calls[0][0];
    expect(erased.floors[0].cells.some((c: { id: string }) => c.id === hud.id)).toBe(false);

    const onPlace = vi.fn();
    rerender(
      <LayoutDesigner
        board={erased}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="corridor"
        issues={[]}
        onBoardChange={onPlace}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId(`slot-${hud.col}-${hud.row}`));
    expect(onPlace).toHaveBeenCalled();
    const placed = onPlace.mock.calls[0][0];
    expect(
      placed.floors[0].cells.some(
        (c: { kind?: string; col?: number; row?: number }) =>
          c.kind === 'corridor' && c.col === hud.col && c.row === hud.row,
      ),
    ).toBe(true);
  });

  it('places a room then a door from the palette tools', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const { rerender } = render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="room"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-1-1'));
    expect(onBoardChange).toHaveBeenCalled();
    const afterRoom = onBoardChange.mock.calls[0][0] as Board;
    expect(afterRoom.floors[0]?.cells.some((c) => c.kind === 'room' && c.col === 1 && c.row === 1)).toBe(true);

    const neighbor = afterRoom.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    rerender(
      <LayoutDesigner
        board={afterRoom}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={neighbor.id}
        tool="door"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId(`slot-${neighbor.col}-${neighbor.row}`));
    const afterDoor = onBoardChange.mock.calls.at(-1)![0] as Board;
    expect(afterDoor.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('door');
  });

  it('creates a pack from the Packs tab so Tile Actions can assign it', () => {
    const onDraftChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        packs={[]}
        selectedFloorId="ground"
        selectedCellId="ground-c1"
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onDraftChange={onDraftChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    expect(onDraftChange).toHaveBeenCalled();
    const next = onDraftChange.mock.calls[0][0];
    expect(next.packs).toEqual(['pack-1']);
    expect(next.cards).toEqual([]);
  });

  it('sets a HUD cell to spinner from Tile Actions', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={hud.id}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
    expect(onBoardChange).toHaveBeenCalled();
    const next = onBoardChange.mock.calls[0][0] as Board;
    expect(next.floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBe('spinner');
  });

  it('enables level hold from the Levels tab', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    expect(screen.queryByTestId('hold-editor')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Levels' }));
    expect(screen.getByTestId('hold-editor')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Level hold'));
    const next = onBoardChange.mock.calls[0][0] as Board;
    expect(next.floors[0]?.holdEnabled).toBe(true);
  });

  it('places HUD on the inner free ring', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="hud"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-1-1'));
    const next = onBoardChange.mock.calls[0][0] as Board;
    expect(next.floors[0]?.cells.some((c) => c.kind === 'hud' && c.col === 1 && c.row === 1)).toBe(true);
  });

  it('opens the 3D preview in a popup', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    expect(screen.queryByTestId('floor-preview')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByTestId('preview-dialog')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
  });

  it('opens the Start tab and adds a splash', () => {
    const onGameStartChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
        onGameStartChange={onGameStartChange}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Start' }));
    expect(screen.getByText('Game start')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Add splash' }));
    expect(onGameStartChange).toHaveBeenCalled();
    const next = onGameStartChange.mock.calls.at(-1)![0];
    expect(next.splashes).toHaveLength(1);
  });

  it('disables Shape after Start and Reset restores it', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const props = {
      cards: [] as { pack: string }[],
      selectedFloorId: 'ground',
      selectedCellId: 'ground-c0',
      tool: 'select' as const,
      issues: [],
      onBoardChange,
      onSelectFloor: () => {},
      onSelectCell: () => {},
      onToolChange: () => {},
    };
    const { rerender } = render(<LayoutDesigner board={board} {...props} />);
    expect(screen.getByLabelText('Shape')).toHaveProperty('disabled', false);
    fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
    const started = onBoardChange.mock.calls.at(-1)![0] as Board;
    rerender(<LayoutDesigner board={started} {...props} />);
    expect(screen.getByLabelText('Shape')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset level' }).at(-1)!);
    const reset = onBoardChange.mock.calls.at(-1)![0] as Board;
    expect(reset.floors[0]!.cells.some((c) => c.start)).toBe(false);
    rerender(<LayoutDesigner board={reset} {...props} />);
    expect(screen.getByLabelText('Shape')).toHaveProperty('disabled', false);
  });

  it('asks before Delete level', () => {
    const onBoardChange = vi.fn();
    const board = createBoard(
      [createLoopedFloor('ground', 'Level 1', 0), createLoopedFloor('floor-1', 'Level 2', 1)],
      [],
    );
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="floor-1"
        selectedCellId={null}
        tool="select"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Level 2' }));
    expect(screen.getByText('Delete Level 2?')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onBoardChange).not.toHaveBeenCalled();
  });
});

