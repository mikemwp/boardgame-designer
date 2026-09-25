import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StartEditor } from '@/components/designer/StartEditor';
import { emptyGameStart } from '@/lib/engine/audio';
import { memoryMediaStore } from '@/lib/library/media-store';

describe('StartEditor', () => {
  it('shows empty splash and menu copy', () => {
    render(
      <StartEditor
        value={emptyGameStart()}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Game start')).toBeDefined();
    expect(
      screen.getByText('No splash screens. After any background, Test and Play open Join Game.'),
    ).toBeDefined();
    expect(screen.getByText('Background image')).toBeDefined();
    expect(screen.getByText('Stay throughout the game')).toBeDefined();
  });

  it('adds a splash with a caption field', () => {
    const onChange = vi.fn();
    render(
      <StartEditor
        value={emptyGameStart()}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add splash' }));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)![0];
    expect(next.splashes).toHaveLength(1);
  });

  it('toggles stay throughout', () => {
    const onChange = vi.fn();
    render(
      <StartEditor
        value={emptyGameStart()}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Stay throughout the game'));
    expect(onChange.mock.calls.at(-1)![0].stayThroughout).toBe(false);
  });
});
