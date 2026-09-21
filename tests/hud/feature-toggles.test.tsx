import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { defaultGameConfig } from '@/lib/engine/types';

describe('FeatureToggles', () => {
  it('replaces 3D dice with a HUD spinner switch', () => {
    const onChange = vi.fn();
    render(<FeatureToggles config={defaultGameConfig()} onChange={onChange} />);
    expect(screen.queryByText('3D dice')).toBeNull();
    expect(screen.getByText('HUD spinner')).toBeDefined();
    expect(screen.getByText('2 dice (2–12)')).toBeDefined();
    fireEvent.click(screen.getByRole('switch', { name: 'HUD spinner' }));
    expect(onChange).toHaveBeenCalledWith({ movementViz: 'spinner' });
  });

  it('relabels the count toggle for spinner 1-12', () => {
    render(
      <FeatureToggles
        config={{ ...defaultGameConfig(), movementViz: 'spinner' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Spinner 1–12')).toBeDefined();
  });
});
