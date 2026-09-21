import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PassStatus } from '@/components/hud/PassStatus';

describe('PassStatus', () => {
  it('renders nothing when passes are disabled', () => {
    const { container } = render(
      <PassStatus passesEnabled={false} passesLeftByPack={{ climb: 1 }} />,
    );
    expect(container.textContent).toBe('');
  });

  it('shows remaining passes per pack', () => {
    render(<PassStatus passesEnabled passesLeftByPack={{ climb: 1 }} />);
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });
});
