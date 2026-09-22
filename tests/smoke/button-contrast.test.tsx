import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('designer button contrast', () => {
  it('keeps outline labels visible without hover', () => {
    render(
      <div className="bg-slate-950 p-4">
        <Button type="button" variant="outline">Corridor square</Button>
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Corridor square' });
    expect(button.className).toMatch(/text-foreground/);
  });
});
