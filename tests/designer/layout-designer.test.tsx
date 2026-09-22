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
    expect(screen.getByTestId('designer-palette').className).toMatch(/ml-auto/);
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
});
