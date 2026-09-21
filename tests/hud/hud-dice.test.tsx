import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudDice } from '@/components/hud/HudDice';
import { hudDiceFaces, hudDieRotation } from '@/lib/view/hud-dice';

describe('hudDiceFaces', () => {
  it('uses engine faces for one die and two dice', () => {
    expect(hudDiceFaces({ value: 4, sides: 6, id: 1, faces: [4] }, 1)).toEqual([4]);
    expect(hudDiceFaces({ value: 7, sides: 12, id: 2, faces: [3, 4] }, 2)).toEqual([3, 4]);
  });
});

describe('HudDice', () => {
  it('renders one labelled cube for 1d6', () => {
    render(<HudDice faces={[5]} tumbling={false} rollId={1} />);
    expect(screen.getByLabelText('Die showing 5')).toBeDefined();
    expect(screen.getAllByLabelText(/Die showing/)).toHaveLength(1);
  });

  it('renders two cubes for 2d6', () => {
    render(<HudDice faces={[3, 4]} tumbling={false} rollId={2} />);
    expect(screen.getByLabelText('Die showing 3')).toBeDefined();
    expect(screen.getByLabelText('Die showing 4')).toBeDefined();
  });

  it('marks cubes as tumbling', () => {
    const { container } = render(<HudDice faces={[2]} tumbling rollId={3} />);
    expect(container.querySelector('.hud-die--tumble')).not.toBeNull();
  });

  it('settles the cube to the engine face rotation', () => {
    const { container } = render(<HudDice faces={[6]} tumbling={false} rollId={4} />);
    const die = container.querySelector('.hud-die') as HTMLElement;
    const rot = hudDieRotation(6);
    expect(die.style.transform).toContain(`${rot.rotateX}deg`);
    expect(die.style.transform).toContain(`${rot.rotateY}deg`);
  });
});
