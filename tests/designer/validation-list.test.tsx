import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationList } from '@/components/designer/ValidationList';

describe('ValidationList', () => {
  it('lists Test blockers', () => {
    render(
      <ValidationList
        issues={[
          { code: 'dangling-stair', message: 'Ground: stair has no destination.' },
        ]}
      />,
    );
    expect(screen.getByTestId('layout-issues').textContent).toContain('Test is blocked');
    expect(screen.getByText('Ground: stair has no destination.')).toBeDefined();
  });
});
