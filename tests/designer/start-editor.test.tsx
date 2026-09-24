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
      screen.getByText(
        'No splash screens. Test and Play skip straight to the board unless you add a menu.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText('No menu items. After splashes (if any), play starts by itself.'),
    ).toBeDefined();
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

  it('adds a Play menu item, then Continue', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StartEditor
        value={emptyGameStart()}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    const afterPlay = onChange.mock.calls.at(-1)![0];
    expect(afterPlay.menu.items[0]).toMatchObject({ label: 'Play', action: 'play' });
    rerender(
      <StartEditor
        value={afterPlay}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    const afterContinue = onChange.mock.calls.at(-1)![0];
    expect(afterContinue.menu.items[1]).toMatchObject({ label: 'Continue', action: 'continue' });
  });
});
