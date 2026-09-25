import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudSpinner } from '@/components/hud/HudSpinner';
import { spinnerLandingDegrees, spinnerMax } from '@/lib/view/hud-spinner';

const spinToItem = vi.fn();
const remove = vi.fn();

vi.mock('spin-wheel', () => ({
  Wheel: class {
    image: unknown = null;
    constructor(public el: HTMLElement, _props: { isInteractive?: boolean }) {
      el.dataset.wheelMounted = 'true';
    }
    spinToItem(...args: unknown[]) {
      spinToItem(...args);
    }
    remove() {
      remove();
    }
  },
}));

describe('spinner math', () => {
  it('treats sides 12 as a 1-12 wheel, not 2d6', () => {
    expect(spinnerMax(12)).toBe(12);
    expect(spinnerMax(6)).toBe(6);
    expect(spinnerLandingDegrees(1, 12, 0)).toBe(0);
    expect(spinnerLandingDegrees(12, 12, 0)).toBe(330);
    expect(spinnerLandingDegrees(1, 6, 0)).toBe(0);
    expect(spinnerLandingDegrees(6, 6, 0)).toBe(300);
  });
});

describe('HudSpinner', () => {
  beforeEach(() => {
    spinToItem.mockClear();
    remove.mockClear();
  });

  it('labels a 1-12 result', () => {
    render(<HudSpinner value={7} max={12} spinning={false} rollId={1} />);
    expect(screen.getByLabelText('Spinner showing 7 of 12')).toBeDefined();
  });

  it('labels a 1-6 result', () => {
    render(<HudSpinner value={3} max={6} spinning={false} rollId={2} />);
    expect(screen.getByLabelText('Spinner showing 3 of 6')).toBeDefined();
  });

  it('mounts a canvas wheel with flick off and spins to the engine index', () => {
    render(<HudSpinner value={7} max={12} spinning rollId={3} />);
    expect(screen.getByTestId('hud-spinner').getAttribute('data-interactive')).toBe('false');
    expect(screen.getByTestId('hud-spinner-canvas')).toBeDefined();
    expect(screen.getByTestId('spinner-pointer')).toBeDefined();
    expect(spinToItem).toHaveBeenCalled();
    expect(spinToItem.mock.calls[0]?.[0]).toBe(6);
  });

  it('keeps isInteractive off for a catalog spinner in Test/Play', () => {
    render(
      <HudSpinner
        value={2}
        max={6}
        spinning
        rollId={4}
        spinner={{
          id: 'spinner-1',
          name: 'Move',
          split: 'equal',
          template: 'wood',
          segments: [
            { id: 'a', label: '1' },
            { id: 'b', label: '2' },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('hud-spinner').getAttribute('data-template')).toBe('wood');
    expect(screen.getByTestId('hud-spinner').getAttribute('data-interactive')).toBe('false');
    expect(screen.getByTestId('spinner-pointer')).toBeDefined();
    expect(screen.getByLabelText('Spinner showing 2')).toBeDefined();
    expect(spinToItem.mock.calls[0]?.[0]).toBe(1);
  });
});
