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

  it('has Roll dice and no Climb stair debug control', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Climb stair' })).toBeNull();
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
});

