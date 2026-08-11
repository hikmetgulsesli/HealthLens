// SHA-256 via Web Crypto API (browser/RN with polyfill) or Node crypto (tests).
type DigestFn = (algorithm: string, data: ArrayBuffer) => Promise<ArrayBuffer>;

interface CryptoLike {
  subtle?: { digest: DigestFn };
}

function getSubtle(): DigestFn {
  const g = globalThis as unknown as { crypto?: CryptoLike };
  if (g.crypto?.subtle?.digest) {
    return g.crypto.subtle.digest.bind(g.crypto.subtle);
  }
  // Node fallback for jest / SSR.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as { webcrypto: { subtle: { digest: DigestFn } } };
  return nodeCrypto.webcrypto.subtle.digest.bind(nodeCrypto.webcrypto.subtle);
}

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await getSubtle()('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}