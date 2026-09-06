import { AiError, type AiErrorKind } from '../../../src/services/ai/errors';

const ALL_KINDS: AiErrorKind[] = [
  'timeout',
  'rate_limit',
  'auth',
  'network',
  'invalid_payload',
  'provider_error',
  'parse_error',
];

describe('AiError', () => {
  it('carries kind, message and optional retryAfterSec', () => {
    const e = new AiError('timeout', 'timed out', 5);
    expect(e.kind).toBe('timeout');
    expect(e.message).toBe('timed out');
    expect(e.retryAfterSec).toBe(5);
    expect(e.name).toBe('AiError');
  });

  it('retryAfterSec is undefined when omitted', () => {
    const e = new AiError('auth', 'no token');
    expect(e.retryAfterSec).toBeUndefined();
  });

  it('is catchable as a built-in Error (instanceof chain)', () => {
    const e = new AiError('parse_error', 'bad json');
    expect(e).toBeInstanceOf(AiError);
    expect(e).toBeInstanceOf(Error);
  });

  it('propagates its message through Error.captureStackTrace-equivalent path', () => {
    const e = new AiError('network', 'connection refused');
    expect(e.message).toBe('connection refused');
    expect(e.stack).toBeDefined();
  });

  it('covers every documented kind in the type union', () => {
    for (const k of ALL_KINDS) {
      const e = new AiError(k, `test-${k}`);
      expect(e.kind).toBe(k);
      expect(e.message).toBe(`test-${k}`);
    }
  });
});
