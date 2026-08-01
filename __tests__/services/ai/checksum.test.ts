import { sha256 } from '../../../src/services/ai/checksum';

describe('sha256', () => {
  it('returns a 64-char hex string', () => {
    const buf = new TextEncoder().encode('hello').buffer;
    const result = sha256(buf);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for same input', () => {
    const buf = new TextEncoder().encode('meal-photo').buffer;
    expect(sha256(buf)).toBe(sha256(buf));
  });

  it('produces different digests for different inputs', () => {
    const a = sha256(new TextEncoder().encode('a').buffer);
    const b = sha256(new TextEncoder().encode('b').buffer);
    expect(a).not.toBe(b);
  });
});
