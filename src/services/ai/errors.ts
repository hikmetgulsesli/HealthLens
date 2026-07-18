export type AiErrorKind =
  | 'timeout'
  | 'rate_limit'
  | 'auth'
  | 'network'
  | 'invalid_payload'
  | 'provider_error'
  | 'parse_error';

export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly retryAfterSec?: number;

  constructor(kind: AiErrorKind, message: string, retryAfterSec?: number) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
  }
}
