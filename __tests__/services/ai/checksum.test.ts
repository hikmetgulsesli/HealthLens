import { sha256 } from '../../../src/services/ai/checksum';

describe('sha256', () => {
  it('returns a 64-char hex string', async () => {
    const buf = new TextEncoder().encode('hello').buffer;
    const result = await sha256(buf);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for same input', async () => {
    const buf = new TextEncoder().encode('meal-photo').buffer;
    const a = await sha256(buf);
    const b = await sha256(buf);
    expect(a).toBe(b);
  });

  it('produces different digests for different inputs', async () => {
    const a = await sha256(new TextEncoder().encode('a').buffer);
    const b = await sha256(new TextEncoder().encode('b').buffer);
    expect(a).not.toBe(b);
  });
});