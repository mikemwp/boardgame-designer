import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HoldEditor } from '@/components/designer/HoldEditor';
import { createLoopedFloor } from '@/lib/engine/layout';
import { memoryMediaStore } from '@/lib/library/media-store';

describe('HoldEditor', () => {
  it('enables level hold and sets a pack quota', () => {
    const onChange = vi.fn();
    const floor = { ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: false, holdQuotas: {} };
    const { rerender } = render(<HoldEditor floor={floor} packIds={['climb']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Level hold'));
    expect(onChange).toHaveBeenCalledWith({ holdEnabled: true });
    rerender(
      <HoldEditor
        floor={{ ...floor, holdEnabled: true, holdQuotas: { climb: 1 } }}
        packIds={['climb']}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Quota for climb'), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith({ holdQuotas: { climb: 3 } });
  });

  it('asks for packs when hold is on and the catalog is empty', () => {
    const floor = { ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: true };
    render(<HoldEditor floor={floor} packIds={[]} onChange={() => {}} />);
    expect(screen.getByText('Create a pack in Packs to set reveal quotas.')).toBeDefined();
  });

  it('shows a level background inherit hint', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    render(
      <HoldEditor
        floor={floor}
        packIds={[]}
        onChange={() => {}}
        gameId="g1"
        media={memoryMediaStore()}
        onBackgroundChange={() => {}}
      />,
    );
    expect(screen.getByText('Uses the Start background.')).toBeDefined();
  });
});
