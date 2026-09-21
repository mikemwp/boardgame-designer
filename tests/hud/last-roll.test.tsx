import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LastRoll } from '@/components/hud/LastRoll';
import { HoldStatus } from '@/components/hud/HoldStatus';

describe('LastRoll', () => {
  it('shows empty state', () => {
    render(<LastRoll lastRoll={null} />);
    expect(screen.getByText('No roll yet')).toBeDefined();
  });

  it('shows a held zero', () => {
    render(<LastRoll lastRoll={{ value: 0, sides: 6, id: 1, faces: [] }} />);
    expect(screen.getByText(/stairs held/i)).toBeDefined();
  });

  it('shows the face and sides', () => {
    render(<LastRoll lastRoll={{ value: 4, sides: 6, id: 2, faces: [4] }} />);
    expect(screen.getByText('Last roll: 4 (d6)')).toBeDefined();
  });

  it('shows 2d6 sum when two faces were rolled', () => {
    render(<LastRoll lastRoll={{ value: 7, sides: 12, id: 3, faces: [3, 4] }} />);
    expect(screen.getByText('Last roll: 3 + 4 = 7 (2d6)')).toBeDefined();
  });

  it('shows spinner 1-12 copy, not 2d6 faces', () => {
    render(
      <LastRoll
        lastRoll={{ value: 7, sides: 12, id: 4, faces: [7] }}
        movementViz="spinner"
      />,
    );
    expect(screen.getByText('Last spin: 7 (1–12)')).toBeDefined();
    expect(screen.queryByText(/2d6/)).toBeNull();
  });
});

describe('HoldStatus', () => {
  it('renders nothing when hold is inactive', () => {
    const { container } = render(<HoldStatus hold={null} floorLabel="Floor 1" />);
    expect(container.textContent).toBe('');
  });

  it('shows pack progress', () => {
    render(
      <HoldStatus
        hold={{ floorId: 'f1', quotas: { climb: 1 }, counts: {}, active: true }}
        floorLabel="Floor 1"
      />,
    );
    expect(screen.getByText(/Held on Floor 1/)).toBeDefined();
    expect(screen.getByText(/climb 0\/1/)).toBeDefined();
  });
});
