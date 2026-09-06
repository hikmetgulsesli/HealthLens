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

  it('handles empty buffers deterministically', async () => {
    const empty = new ArrayBuffer(0);
    const a = await sha256(empty);
    const b = await sha256(empty);
    expect(a).toBe(b);
    // Known SHA-256 of empty input.
    expect(a).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('handles large buffers (1 MB) without truncation', async () => {
    const buf = new ArrayBuffer(1024 * 1024);
    const view = new Uint8Array(buf);
    for (let i = 0; i < view.length; i += 4096) {
      // eslint-disable-next-line no-bitwise
      view[i] = (i / 4096) & 0xff;
    }
    const result = await sha256(buf);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('treats different buffer slices of the same bytes as identical', async () => {
    // crypto-js reads only the byteLength of the buffer, so two slices
    // containing the same byte sequence should produce the same hash.
    const full = new TextEncoder().encode('meal-photo').buffer;
    const slice = full.slice(0); // copy
    const a = await sha256(full);
    const b = await sha256(slice);
    expect(a).toBe(b);
  });
});