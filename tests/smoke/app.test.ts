import { describe, it, expect } from 'vitest';

describe('app scaffold', () => {
  it('has building board title constant', () => {
    expect(process.env.NEXT_PUBLIC_APP_NAME).toBe('Building Board Template');
  });
});
