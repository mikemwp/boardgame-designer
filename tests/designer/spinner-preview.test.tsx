import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SpinnerPreview } from '@/components/designer/SpinnerPreview';
import { createSpinner } from '@/lib/designer/spinners';

const spinToItem = vi.fn();

vi.mock('spin-wheel', () => ({
  Wheel: class {
    constructor(el: HTMLElement) {
      el.dataset.wheelMounted = 'true';
    }
    spinToItem(...args: unknown[]) {
      spinToItem(...args);
    }
    remove() {}
  },
}));

describe('SpinnerPreview', () => {
  it('renders an interactive HUD wheel and Spin uses sampleSegment then spinToItem', () => {
    const spinner = createSpinner([], 'spinner-1')[0]!;
    render(<SpinnerPreview spinner={spinner} />);
    const host = screen.getByTestId('spinner-preview');
    expect(host).toBeDefined();
    expect(screen.getByTestId('hud-spinner').getAttribute('data-interactive')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }));
    expect(spinToItem).toHaveBeenCalled();
    const index = spinToItem.mock.calls[0]?.[0] as number;
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(spinner.segments.length);
  });
});
