import { createHash } from 'crypto';

export function sha256(buffer: ArrayBuffer): string {
  const hash = createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}
