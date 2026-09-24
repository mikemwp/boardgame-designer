import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameStartOverlay } from '@/components/hud/GameStartOverlay';

describe('GameStartOverlay', () => {
  it('renders children only when the phase is skip', () => {
    render(
      <GameStartOverlay phase="skip" start={{ splashes: [], menu: { items: [] } }}>
        <div>Board</div>
      </GameStartOverlay>,
    );
    expect(screen.getByText('Board')).toBeDefined();
    expect(screen.queryByTestId('game-start-overlay')).toBeNull();
  });

  it('shows a splash with Next and Skip all', () => {
    render(
      <GameStartOverlay
        phase="splash"
        splashIndex={0}
        start={{
          splashes: [{ id: 's1', caption: 'Welcome', skippable: true }],
          menu: { items: [] },
        }}
        onNext={() => {}}
        onSkipAll={() => {}}
      >
        <div>Board</div>
      </GameStartOverlay>,
    );
    expect(screen.getByTestId('game-start-overlay')).toBeDefined();
    expect(screen.getByText('Welcome')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Skip all' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mute' })).toBeDefined();
  });

  it('disables Continue with No saved game', () => {
    render(
      <GameStartOverlay
        phase="menu"
        start={{
          splashes: [],
          menu: { items: [{ id: 'm1', label: 'Continue', action: 'continue' }] },
        }}
        onContinue={() => {}}
      >
        <div>Board</div>
      </GameStartOverlay>,
    );
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont).toHaveProperty('disabled', true);
    expect(cont.getAttribute('title')).toBe('No saved game');
  });

  it('shows Tap to start when autoplay is blocked', () => {
    const onTapToStart = vi.fn();
    render(
      <GameStartOverlay
        phase="splash"
        splashIndex={0}
        tapToStart
        start={{
          splashes: [{ id: 's1', caption: 'Hello', skippable: true }],
          menu: { items: [] },
        }}
        onTapToStart={onTapToStart}
      >
        <div>Board</div>
      </GameStartOverlay>,
    );
    fireEvent.click(screen.getByTestId('tap-to-start'));
    expect(onTapToStart).toHaveBeenCalled();
  });
});
