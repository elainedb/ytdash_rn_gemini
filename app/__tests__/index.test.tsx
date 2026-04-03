import { describe, it, expect } from '@jest/globals';

describe('App', () => {
  it('should pass a basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should have correct math', () => {
    expect(1 + 1).toBe(2);
  });
});
