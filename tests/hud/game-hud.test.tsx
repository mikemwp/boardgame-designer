import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: ({
    allowSlide,
    onTokenSlideComplete,
  }: {
    allowSlide?: boolean;
    onTokenSlideComplete?: () => void;
  }) => (
    <div data-testid="board" data-allow-slide={allowSlide ? 'yes' : 'no'}>
      {allowSlide ? (
        <button type="button" onClick={() => onTokenSlideComplete?.()}>
          Finish slide
        </button>
      ) : null}
    </div>
  ),
}));

import { GameHud } from '@/components/hud/GameHud';
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';
import { climbSample } from '@/lib/samples/climb';
import { HUD_DICE_TUMBLE_MS } from '@/lib/view/hud-dice';

describe('GameHud', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not stretch the test canvas with a full-width 480px frame', () => {
    const { container } = render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByTestId('test-hud').className).toMatch(/overflow-hidden/);
    expect(container.querySelector('.h-\\[480px\\]')).toBeNull();
  });

  it('gives the canvas the remaining width and sizes the HUD pane to its controls', () => {
    render(<GameHud bootstrap={climbSample} />);
    const hud = screen.getByTestId('test-hud');
    expect(hud.className).toMatch(/flex-1/);
    expect(hud.className).toMatch(/minmax\(0,1fr\)_max-content/);
    expect(hud.className).not.toMatch(/2fr_1fr/);
    expect(hud.className).not.toMatch(/16rem/);
    expect(hud.className).not.toMatch(/max-content\)_minmax/);
    const pane = screen.getByTestId('test-hud-pane');
    expect(pane.tagName).toBe('ASIDE');
    expect(pane.contains(screen.getByRole('button', { name: 'Roll dice' }))).toBe(true);
    expect(pane.contains(screen.getByText('No card drawn'))).toBe(true);
    expect(pane.contains(screen.getByRole('switch', { name: 'HUD spinner' }))).toBe(true);
    expect(screen.getByTestId('board').closest('[data-testid="test-hud-pane"]')).toBeNull();
  });

  it('has Roll dice and no Climb stair debug control', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Climb stair' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Import cards' })).toBeNull();
    expect(screen.getByText('No roll yet')).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
  });

  it('shows remaining passes for the active player', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });

  it('plays HUD dice, then token slide, then card, locking Roll until Play', () => {
    render(<GameHud bootstrap={{ ...climbSample, rng: () => 0 }} />);
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    fireEvent.click(roll);
    expect(roll).toHaveProperty('disabled', true);
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(screen.getByTestId('board').getAttribute('data-allow-slide')).toBe('no');
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    });
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(screen.getByTestId('board').getAttribute('data-allow-slide')).toBe('yes');
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    expect(screen.queryByTestId('hud-dice')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
    expect(roll).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(roll).toHaveProperty('disabled', false);
  });

  it('uses Spin and a 1-12 spinner when HUD spinner is on', () => {
    render(<GameHud bootstrap={{ ...climbSample, rng: () => 0 }} />);
    fireEvent.click(screen.getByRole('switch', { name: 'HUD spinner' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Spinner 1–12' }));
    const spin = screen.getByRole('button', { name: 'Spin' });
    fireEvent.click(spin);
    expect(screen.getByTestId('hud-spinner')).toBeDefined();
    expect(screen.getByLabelText(/Spinner showing/)).toBeDefined();
  });

  it('keeps Roll locked on a timer card until the timer elapses', () => {
    const bootstrap = {
      ...climbSample,
      rng: () => 0,
      config: { ...climbSample.config, actionMode: 'neither' as const },
      cards: {
        ...climbSample.cards,
        deck: [{ id: 't1', pack: 'climb', title: 'Timed', body: 'Wait', timerSeconds: 2 }],
      },
    };
    render(<GameHud bootstrap={bootstrap} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    expect(screen.getByTestId('card-timer')).toBeDefined();
    expect(roll).toHaveProperty('disabled', true);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(roll).toHaveProperty('disabled', false);
  });

  it('unlocks Roll when the extra button is pressed', () => {
    const bootstrap = {
      ...climbSample,
      rng: () => 0,
      config: { ...climbSample.config, actionMode: 'neither' as const },
      cards: {
        ...climbSample.cards,
        deck: [{ id: 't1', pack: 'climb', title: 'Extra', body: 'Tap', extraButton: 'Done' }],
      },
    };
    render(<GameHud bootstrap={bootstrap} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(roll).toHaveProperty('disabled', false);
  });

  it('keeps Roll unlocked after a tumble hide/show of the same extra-button card', () => {
    const bootstrap = {
      ...climbSample,
      rng: () => 0,
      config: { ...climbSample.config, actionMode: 'neither' as const },
      cards: {
        ...climbSample.cards,
        deck: [{ id: 't1', pack: 'climb', title: 'Extra', body: 'Tap', extraButton: 'Done' }],
      },
    };
    render(<GameHud bootstrap={bootstrap} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(roll).toHaveProperty('disabled', false);

    fireEvent.click(roll);
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    expect(screen.getByRole('button', { name: 'Done' })).toBeDefined();
    expect(screen.getByText('Extra')).toBeDefined();
    expect(roll).toHaveProperty('disabled', false);
  });

  it('shows no overlay on empty Climb and keeps Roll', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.queryByTestId('game-start-overlay')).toBeNull();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mute' })).toBeDefined();
  });

  it('locks Roll behind splash then Play', () => {
    render(
      <GameHud
        bootstrap={climbSample}
        gameStart={{
          splashes: [{ id: 's1', caption: 'Welcome', skippable: true, durationMs: 0 }],
          menu: {
            items: [
              { id: 'm1', label: 'Play', action: 'play' },
              { id: 'm2', label: 'Continue', action: 'continue' },
            ],
          },
        }}
      />,
    );
    expect(screen.getByTestId('game-start-overlay')).toBeDefined();
    expect(screen.getByText('Welcome')).toBeDefined();
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Saved game' })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.queryByTestId('game-start-overlay')).toBeNull();
    expect(roll).toHaveProperty('disabled', false);
  });

  it('always shows inventory and last-spin, and choose setup locks Roll until confirmed', () => {
    const bootstrap = {
      ...climbSample,
      items: [{ id: 'item-1', name: 'Lock pick', starting: true }],
      itemAssign: 'choose' as const,
    };
    render(<GameHud bootstrap={bootstrap} />);
    expect(screen.getByTestId('inventory-bar').textContent).toBe('Inventory empty');
    expect(screen.getByText('No outcome spin yet')).toBeDefined();
    expect(screen.getByTestId('item-setup')).toBeDefined();
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByLabelText('Take Lock pick'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm items' }));
    expect(screen.queryByTestId('item-setup')).toBeNull();
    expect(screen.getByTestId('inventory-bar').textContent).toBe('Inventory: Lock pick');
    expect(roll).toHaveProperty('disabled', false);
  });

  it('shows item setup after the start overlay in choose mode', () => {
    render(
      <GameHud
        bootstrap={{
          ...climbSample,
          items: [{ id: 'item-1', name: 'Lock pick', starting: true }],
          itemAssign: 'choose',
        }}
        gameStart={{
          splashes: [{ id: 's1', caption: 'Welcome', skippable: true, durationMs: 0 }],
          menu: {
            items: [
              { id: 'm1', label: 'Play', action: 'play' },
              { id: 'm2', label: 'Continue', action: 'continue' },
            ],
          },
        }}
      />,
    );
    expect(screen.getByTestId('game-start-overlay')).toBeDefined();
    expect(screen.queryByTestId('item-setup')).toBeNull();
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.queryByTestId('game-start-overlay')).toBeNull();
    expect(screen.getByTestId('item-setup')).toBeDefined();
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm items' }));
    expect(screen.queryByTestId('item-setup')).toBeNull();
    expect(roll).toHaveProperty('disabled', false);
  });

  it('shows last outcome spin after landing on a spinner tile', () => {
    const bootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor' as const, col: 0, row: 0 },
              {
                id: 'l1',
                index: 1,
                kind: 'corridor' as const,
                col: 1,
                row: 0,
                spinnerId: 'spinner-1',
              },
            ],
          },
        ],
        [],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' as const },
      rng: () => 0,
      spinners: [
        {
          id: 'spinner-1',
          name: 'Luck',
          split: 'equal' as const,
          segments: [
            { id: 'a', label: 'Me' },
            { id: 'b', label: 'You' },
          ],
        },
      ],
    };
    render(<GameHud bootstrap={bootstrap} />);
    expect(screen.getByText('No outcome spin yet')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => {
      vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    expect(screen.getByText('Last spin: Me (Luck)')).toBeDefined();
  });

  it('hides Last roll and Player bar when other HUD widgets are designed', () => {
    const board = {
      ...climbSample.board,
      floors: climbSample.board.floors.map((floor) => ({
        ...floor,
        cells: floor.cells.map((cell) =>
          cell.kind === 'hud' ? { ...cell, hudWidget: 'dice' as const } : cell,
        ),
      })),
    };
    render(<GameHud bootstrap={{ ...climbSample, board }} />);
    expect(screen.queryByText('No roll yet')).toBeNull();
    expect(screen.queryByText(/Climber/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
  });

  it('locks Roll for Enter/Pass on a room and Leave inside a multi room', () => {
    const interior = [
      { id: 'room-1-c0', index: 0, kind: 'corridor' as const, start: true, col: 0, row: 0 },
      { id: 'room-1-c1', index: 1, kind: 'corridor' as const, col: 1, row: 0 },
      { id: 'room-1-c2', index: 2, kind: 'corridor' as const, col: 2, row: 0 },
      { id: 'room-1-c3', index: 3, kind: 'corridor' as const, col: 0, row: 1 },
    ];
    const bootstrap = {
      board: createBoard(
        [
          {
            id: 'lobby',
            index: 0,
            label: 'Lobby',
            cells: [
              { id: 'l0', index: 0, kind: 'corridor' as const, col: 0, row: 0 },
              { id: 'l1', index: 1, kind: 'room' as const, roomId: 'room-1', col: 1, row: 0 },
              { id: 'l2', index: 2, kind: 'corridor' as const, col: 2, row: 0 },
            ],
          },
        ],
        [],
        [{ id: 'room-1', name: 'Room 1', mode: 'multi' as const, shape: { kind: 'square' as const, tilesPerSide: 3 }, cells: interior }],
      ),
      players: addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'A',
        token: { floorId: 'lobby', cellId: 'l0' },
      }),
      cards: createCardState([]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' as const },
      rng: () => 0,
    };
    render(<GameHud bootstrap={bootstrap} />);
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    fireEvent.click(roll);
    act(() => {
      vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    expect(screen.getByRole('button', { name: 'Enter' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeDefined();
    expect(roll).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    expect(screen.getByRole('button', { name: 'Leave' })).toBeDefined();
    expect(roll).toHaveProperty('disabled', false);
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(screen.queryByRole('button', { name: 'Leave' })).toBeNull();
    expect(roll).toHaveProperty('disabled', false);
  });

  it('shows a land HUD popup for tile image from the spout', () => {
    const floor = climbSample.board.floors[0]!;
    const start = floor.cells.find((cell) => cell.start) ?? floor.cells[0]!;
    const bootstrap = {
      ...climbSample,
      board: {
        ...climbSample.board,
        floors: climbSample.board.floors.map((entry) =>
          entry.id === floor.id
            ? {
                ...entry,
                look: { popupSpout: 'surround' as const },
                cells: entry.cells.map((cell) =>
                  cell.id === start.id
                    ? { ...cell, image: { id: 'land', name: 'clue.png', source: 'url' as const, src: 'https://ex/clue.png' } }
                    : cell,
                ),
              }
            : entry,
        ),
      },
    };
    render(<GameHud bootstrap={bootstrap} />);
    expect(screen.getByTestId('land-media-popup').getAttribute('data-spout')).toBe('surround');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('land-media-popup')).toBeNull();
  });
});

