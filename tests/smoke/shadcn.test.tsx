import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('shadcn button', () => {
  it('renders children', () => {
    render(<Button>Roll</Button>);
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDefined();
  });
});
