import { AiError } from '../../../src/services/ai/errors';

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
});
