import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import { createBoard } from '@/lib/engine/board';
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
    expect(screen.getByLabelText('Board shape')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tile' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Select' })).toBeDefined();
  });

  it('keeps floor tabs and tool buttons on one toolbar row', () => {
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
    expect(toolbar.contains(screen.getByRole('button', { name: 'Ground' }))).toBe(true);
    expect(toolbar.contains(screen.getByRole('button', { name: 'Select' }))).toBe(true);
    expect(toolbar.contains(screen.getByLabelText('Board shape'))).toBe(true);
    expect(toolbar.contains(screen.getByLabelText('Level name'))).toBe(true);
    expect(screen.getByTestId('designer-palette').className).toMatch(/ml-auto/);
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
});
