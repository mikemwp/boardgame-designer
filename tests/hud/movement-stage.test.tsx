import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovementStage } from '@/components/hud/MovementStage';
import { HUD_DICE_TUMBLE_MS } from '@/lib/view/hud-dice';
import { HUD_SPINNER_MS } from '@/lib/view/hud-spinner';

vi.mock('spin-wheel', () => ({
  Wheel: class {
    constructor(el: HTMLElement) {
      el.dataset.wheelMounted = 'true';
    }
    spinToItem() {}
    remove() {}
  },
}));

describe('MovementStage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing while idle or on a held zero', () => {
    const { rerender } = render(
      <MovementStage
        viz="dice"
        lastRoll={null}
        diceCount={1}
        phase="idle"
        onTumbleComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId('hud-dice')).toBeNull();
    rerender(
      <MovementStage
        viz="dice"
        lastRoll={{ value: 0, sides: 6, id: 1, faces: [] }}
        diceCount={1}
        phase="idle"
        onTumbleComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId('hud-dice')).toBeNull();
  });

  it('shows HUD dice during tumble and slide, then notifies when tumble ends', () => {
    const onTumbleComplete = vi.fn();
    const lastRoll = { value: 4, sides: 6, id: 2, faces: [4] };
    const { rerender } = render(
      <MovementStage
        viz="dice"
        lastRoll={lastRoll}
        diceCount={1}
        phase="tumble"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(onTumbleComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    expect(onTumbleComplete).toHaveBeenCalledTimes(1);
    rerender(
      <MovementStage
        viz="dice"
        lastRoll={lastRoll}
        diceCount={1}
        phase="slide"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-dice')).toBeDefined();
  });

  it('shows the spinner for 1-12 mode and uses spinner duration', () => {
    const onTumbleComplete = vi.fn();
    render(
      <MovementStage
        viz="spinner"
        lastRoll={{ value: 7, sides: 12, id: 3, faces: [7] }}
        diceCount={2}
        phase="tumble"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-spinner')).toBeDefined();
    expect(screen.getByLabelText('Spinner showing 7 of 12')).toBeDefined();
    vi.advanceTimersByTime(HUD_SPINNER_MS);
    expect(onTumbleComplete).toHaveBeenCalledTimes(1);
  });
});
