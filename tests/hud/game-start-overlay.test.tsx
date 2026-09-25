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

  it('shows Join Game with Saved game disabled and a frosted card', () => {
    render(
      <GameStartOverlay
        phase="menu"
        start={{
          splashes: [],
          menu: { items: [] },
        }}
        onContinue={() => {}}
      >
        <div>Board</div>
      </GameStartOverlay>,
    );
    expect(screen.getByTestId('join-game-card')).toBeDefined();
    expect(screen.getByRole('button', { name: 'New game' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tutorial' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Play on this device' })).toBeDefined();
    const saved = screen.getByRole('button', { name: 'Saved game' });
    expect(saved).toHaveProperty('disabled', true);
    expect(saved.getAttribute('title')).toBe('No saved game');
  });

  it('shows the viewport photo under splash', () => {
    render(
      <GameStartOverlay
        phase="splash"
        splashIndex={0}
        backgroundSrc="https://ex/hall.jpg"
        start={{
          splashes: [{ id: 's1', caption: 'Welcome', skippable: true }],
          menu: { items: [] },
        }}
      >
        <div>Board</div>
      </GameStartOverlay>,
    );
    expect(screen.getByTestId('viewport-background')).toBeDefined();
    expect(screen.getByText('Welcome')).toBeDefined();
  });

  it('opens a simple tutorial overlay from Join Game', () => {
    render(
      <GameStartOverlay phase="menu" start={{ splashes: [], menu: { items: [] } }}>
        <div>Board</div>
      </GameStartOverlay>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tutorial' }));
    expect(screen.getByTestId('tutorial-overlay')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('tutorial-overlay')).toBeNull();
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
