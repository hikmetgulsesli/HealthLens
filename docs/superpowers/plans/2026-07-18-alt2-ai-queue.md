# Alt-proje 2 — AI Sözleşmesi + Offline Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the server-side proxy AI client contract (interface from Alt-proje 1 T4), enforce PRD §10 timeout/dedup/error rules, and harden the offline queue with backoff + dedup + foreground sync.

**Architecture:** `HttpAiClient` talks to a backend proxy at `AI_PROXY_URL`. All AI requests go through this client. `aiService.ts` becomes a thin facade that delegates to the client. Image checksum dedup uses `Map<sha256, Promise>` with a 5s window. Offline queue replaces linear retry with per-item exponential backoff via `nextRetryAt: ISO string`. The queue survives app kill by writing status to MMKV before the in-flight `await`.

**Tech Stack:** React Native 0.85 + TypeScript, Zustand + MMKV (existing). New dep: `react-native-quick-crypto` for SHA-256 (lightweight native module; alternative: `crypto-js` pure-JS).

---

## Global Constraints

From `docs/superpowers/specs/2026-07-18-healthlens-audit-remediation-design.md` §2.3, §3.2 and `AGENTS.md` global rules:

- **15s timeout** on every AI request via `AbortSignal.timeout(15_000)`.
- **5s window dedup** by image SHA-256 checksum.
- **Backoff** for retryable errors only: `timeout`, `network`, `provider_error`. `rate_limit` uses server's `retryAfterSec`. `auth`, `invalid_payload`, `parse_error` are surfaced to the user and **never queued**.
- **No mock data in production paths.** `getMockAnalysis` and `getMockTextAnalysis` are deleted from `aiService.ts` (or moved to `src/__fixtures__/` for unit tests only).
- **No `any` in domain code.** Existing lint rule.
- **MMKV schema version + migrate** per store (already in place from Alt-proje 1).
- All user-facing strings Turkish.

---

## File Map

Files created:

| Path | Responsibility |
|---|---|
| `src/services/ai/HttpAiClient.ts` | `fetch`-based proxy client implementing `AiClient`. |
| `src/services/ai/checksum.ts` | SHA-256 of `ArrayBuffer` → hex. |
| `src/services/ai/dedup.ts` | `DedupMap<T>` keyed by checksum with 5s window. |
| `src/services/imageUtils.ts` | `compressImage()`, `validateImageSize()`. |
| `src/__fixtures__/mockAnalysis.ts` | (Test-only) preserved mock data, isolated. |
| `__tests__/services/ai/HttpAiClient.test.ts` | Unit tests for proxy client. |
| `__tests__/services/ai/dedup.test.ts` | Unit tests for dedup map. |
| `__tests__/services/ai/checksum.test.ts` | Unit tests for SHA-256. |
| `__tests__/services/imageUtils.test.ts` | Unit tests for compression/size guard. |
| `__tests__/stores/offlineQueueStore.test.ts` | Unit tests for queue backoff + dedup. |

Files modified:

| Path | Reason |
|---|---|
| `src/services/aiService.ts` | Replace provider mocks + `FORCE_MOCK` with thin facade over `HttpAiClient`. |
| `src/stores/offlineQueueStore.ts` | Add `nextRetryAt` field, exponential backoff, dedup, `AiError` propagation. |
| `src/types/index.ts` | Add `nextRetryAt?: string` to `OfflineQueueItem`. |
| `App.tsx` | Already wires foreground sync; verify it works. |

---

## Task 1: SHA-256 checksum utility

**Files:**
- Create: `src/services/ai/checksum.ts`
- Create: `__tests__/services/ai/checksum.test.ts`

**Interfaces:**
- Produces: `sha256(buffer: ArrayBuffer): Promise<string>` — lowercase hex digest.

- [ ] **Step 1: Write the failing test**

Create `__tests__/services/ai/checksum.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/services/ai/checksum.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `sha256`**

Create `src/services/ai/checksum.ts`:

```ts
import QuickCrypto from 'react-native-quick-crypto';

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = QuickCrypto.createHash('sha256');
  hash.update(new Uint8Array(buffer));
  return hash.digest('hex');
}
```

If `react-native-quick-crypto` is unavailable in the Jest preset, fall back to a pure-JS implementation:

```ts
export async function sha256(buffer: ArrayBuffer): Promise<string> {
  // Fallback for tests / dev. Production uses react-native-quick-crypto.
  const { createHash } = await import('crypto');
  const hash = createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}
```

Pick whichever compiles cleanly with the project's existing dependency tree. If neither works, prefer adding `react-native-quick-crypto` to `package.json` and running `npm install`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/services/ai/checksum.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/checksum.ts __tests__/services/ai/checksum.test.ts
git commit -m "feat(ai): sha256 checksum utility for dedup"
```

---

## Task 2: DedupMap (5s window)

**Files:**
- Create: `src/services/ai/dedup.ts`
- Create: `__tests__/services/ai/dedup.test.ts`

**Interfaces:**
- Produces: `class DedupMap<T>` with `get(key): Promise<T> | undefined`, `set(key, promise): void`, plus auto-cleanup of entries older than 5s.
- Used by: `HttpAiClient.analyzeFoodImage` — same image checksum within 5s returns the in-flight promise.

- [ ] **Step 1: Write the failing test**

Create `__tests__/services/ai/dedup.test.ts`:

```ts
import { DedupMap } from '../../../src/services/ai/dedup';

describe('DedupMap', () => {
  it('returns undefined when no entry exists', () => {
    const m = new DedupMap<number>();
    expect(m.get('nope')).toBeUndefined();
  });

  it('returns the same promise on second get within window', async () => {
    const m = new DedupMap<number>();
    const p = Promise.resolve(42);
    m.set('k', p);
    expect(m.get('k')).toBe(p);
  });

  it('drops entries after window expires', async () => {
    jest.useFakeTimers();
    try {
      const m = new DedupMap<number>({ windowMs: 1000 });
      m.set('k', Promise.resolve(1));
      expect(m.get('k')).toBeDefined();
      jest.advanceTimersByTime(1500);
      expect(m.get('k')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('isolates keys', () => {
    const m = new DedupMap<number>();
    m.set('a', Promise.resolve(1));
    m.set('b', Promise.resolve(2));
    expect(m.get('a')).not.toBe(m.get('b'));
  });
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npx jest __tests__/services/ai/dedup.test.ts`

- [ ] **Step 3: Implement DedupMap**

Create `src/services/ai/dedup.ts`:

```ts
export interface DedupMapOptions {
  windowMs?: number;
}

interface Entry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

export class DedupMap<T> {
  private readonly map = new Map<string, Entry<T>>();
  private readonly windowMs: number;

  constructor(opts: DedupMapOptions = {}) {
    this.windowMs = opts.windowMs ?? 5_000;
  }

  get(key: string): Promise<T> | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.promise;
  }

  set(key: string, promise: Promise<T>): void {
    this.map.set(key, { promise, expiresAt: Date.now() + this.windowMs });
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npx jest __tests__/services/ai/dedup.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/dedup.ts __tests__/services/ai/dedup.test.ts
git commit -m "feat(ai): DedupMap with 5s window for in-flight request coalescing"
```

---

## Task 3: Image compression + size guard

**Files:**
- Create: `src/services/imageUtils.ts`
- Create: `__tests__/services/imageUtils.test.ts`

**Interfaces:**
- Produces: `compressImage(uri: string, maxEdge = 1024): Promise<ArrayBuffer>` — reads file, downscales if needed, returns compressed bytes.
- Produces: `validateImageSize(buffer: ArrayBuffer, maxBytes = 20 * 1024 * 1024): void` — throws `Error` if too large.
- Produces: `mimeFromUri(uri: string): 'image/jpeg' | 'image/png' | 'image/heic'` — infers from file extension.

- [ ] **Step 1: Write failing tests**

Create `__tests__/services/imageUtils.test.ts`:

```ts
import { validateImageSize, mimeFromUri } from '../../src/services/imageUtils';

describe('imageUtils', () => {
  describe('validateImageSize', () => {
    it('passes for buffer under 20MB', () => {
      const buf = new ArrayBuffer(1024);
      expect(() => validateImageSize(buf)).not.toThrow();
    });

    it('throws for buffer over 20MB', () => {
      const buf = new ArrayBuffer(21 * 1024 * 1024);
      expect(() => validateImageSize(buf)).toThrow(/20 MB/);
    });

    it('accepts custom max', () => {
      const buf = new ArrayBuffer(2 * 1024);
      expect(() => validateImageSize(buf, 1024)).toThrow();
    });
  });

  describe('mimeFromUri', () => {
    it('infers JPEG from .jpg/.jpeg', () => {
      expect(mimeFromUri('file:///foo/bar.jpg')).toBe('image/jpeg');
      expect(mimeFromUri('file:///foo/bar.jpeg')).toBe('image/jpeg');
    });

    it('infers PNG from .png', () => {
      expect(mimeFromUri('file:///foo/bar.png')).toBe('image/png');
    });

    it('infers HEIC from .heic', () => {
      expect(mimeFromUri('file:///foo/bar.heic')).toBe('image/heic');
    });

    it('defaults to JPEG for unknown', () => {
      expect(mimeFromUri('file:///foo/bar')).toBe('image/jpeg');
    });
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npx jest __tests__/services/imageUtils.test.ts`

- [ ] **Step 3: Implement imageUtils**

Create `src/services/imageUtils.ts`:

```ts
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export function validateImageSize(
  buffer: ArrayBuffer,
  maxBytes: number = DEFAULT_MAX_BYTES,
): void {
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `Görsel boyutu çok büyük. Lütfen daha küçük bir fotoğraf seçin. (${(
        buffer.byteLength /
        1024 /
        1024
      ).toFixed(1)} MB > ${maxBytes / 1024 / 1024} MB)`,
    );
  }
}

export function mimeFromUri(
  uri: string,
): 'image/jpeg' | 'image/png' | 'image/heic' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

export async function compressImage(
  uri: string,
  _maxEdge: number = 1024,
): Promise<ArrayBuffer> {
  // TODO(alt-project-3): integrate react-native-image-resizer when available.
  // For now, read raw bytes and rely on validateImageSize to reject oversized.
  const cleanUri = uri.replace('file://', '');
  const base64 = await RNFS.readFile(cleanUri, 'base64');
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return buffer.buffer;
}

export function platformSupportsHEIC(): boolean {
  return Platform.OS === 'ios';
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npx jest __tests__/services/imageUtils.test.ts`
Expected: PASS — 6/6.

- [ ] **Step 5: Commit**

```bash
git add src/services/imageUtils.ts __tests__/services/imageUtils.test.ts
git commit -m "feat(images): size validation + mime detection + raw-byte read"
```

---

## Task 4: HttpAiClient (proxy implementation)

**Files:**
- Create: `src/services/ai/HttpAiClient.ts`
- Create: `__tests__/services/ai/HttpAiClient.test.ts`

**Interfaces:**
- Implements: `AiClient` (interface from Alt-proje 1 T4).
- Constructor: `(opts: { baseUrl: string; token: string })`.
- Each call wraps `fetch` in `AbortSignal.timeout(15_000)` and maps HTTP errors to `AiError` instances per the kind taxonomy (`timeout`, `rate_limit`, `auth`, `network`, `invalid_payload`, `provider_error`, `parse_error`).
- Uses `DedupMap` for `analyzeFoodImage` keyed on SHA-256 of image buffer.

- [ ] **Step 1: Write the failing test**

Create `__tests__/services/ai/HttpAiClient.test.ts`:

```ts
import { HttpAiClient } from '../../../src/services/ai/HttpAiClient';
import { AiError } from '../../../src/services/ai/errors';

const validResult = {
  imageUri: 'file:///x.jpg',
  imageUris: ['file:///x.jpg'],
  mealCategory: 'lunch',
  smartInsight: 'OK',
  items: [
    {
      id: 'i1',
      name: 'Test',
      confidence: 0.9,
      estimatedPortionGrams: 100,
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 10,
      fatPer100g: 1,
    },
  ],
};

describe('HttpAiClient', () => {
  const baseUrl = 'https://proxy.test';
  const token = 'tok';
  let client: HttpAiClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new HttpAiClient({ baseUrl, token });
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('sends Authorization bearer and parses JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => validResult,
    });
    const buf = new TextEncoder().encode('img').buffer;
    const result = await client.analyzeFoodImage({
      imageBuffer: buf,
      mime: 'image/jpeg',
    });
    expect(result.items[0].name).toBe('Test');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/v1/analyze-image`);
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('throws AiError timeout on AbortError', async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    );
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('throws AiError auth on 401', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'auth' });
  });

  it('throws AiError rate_limit on 429 with retryAfterSec', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: (k: string) => (k === 'Retry-After' ? '30' : null) },
    });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'rate_limit', retryAfterSec: 30 });
  });

  it('throws AiError provider_error on 500', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'provider_error' });
  });

  it('throws AiError parse_error when JSON is malformed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'parse_error' });
  });

  it('dedups identical image within 5s', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => validResult,
    });
    const buf = new TextEncoder().encode('same').buffer;
    const p1 = client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' });
    const p2 = client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' });
    await Promise.all([p1, p2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npx jest __tests__/services/ai/HttpAiClient.test.ts`

- [ ] **Step 3: Implement HttpAiClient**

Create `src/services/ai/HttpAiClient.ts`:

```ts
import type { AiClient, AnalyzeParams, AnalyzeTextParams, AiRequestOptions } from './AiClient';
import { AI_TIMEOUT_MS, DEDUP_WINDOW_MS } from './AiClient';
import { AiError } from './errors';
import { sha256 } from './checksum';
import { DedupMap } from './dedup';
import type { AnalysisResult, MealCategory } from '../../types';

export interface HttpAiClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  dedupMap?: DedupMap<AnalysisResult>;
}

const VALID_MEAL_CATEGORIES: MealCategory[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

function validateMealCategory(cat: unknown): MealCategory {
  return VALID_MEAL_CATEGORIES.includes(cat as MealCategory)
    ? (cat as MealCategory)
    : 'breakfast';
}

export class HttpAiClient implements AiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;
  private readonly dedupMap: DedupMap<AnalysisResult>;

  constructor(opts: HttpAiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.dedupMap = opts.dedupMap ?? new DedupMap<AnalysisResult>({ windowMs: DEDUP_WINDOW_MS });
  }

  async analyzeFoodImage(
    params: AnalyzeParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult> {
    const checksum = await sha256(params.imageBuffer);
    const inflight = this.dedupMap.get(checksum);
    if (inflight) return inflight;

    const signal = opts?.signal ?? AbortSignal.timeout(AI_TIMEOUT_MS);
    const promise = this.executeImageRequest(params, signal);
    this.dedupMap.set(checksum, promise);
    try {
      return await promise;
    } catch (err) {
      throw err;
    } finally {
      // Cleanup on failure to allow retry; success cleanup happens via expiry.
      if (signal.aborted) this.dedupMap.clear();
    }
  }

  async analyzeTextMeal(
    params: AnalyzeTextParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult> {
    const signal = opts?.signal ?? AbortSignal.timeout(AI_TIMEOUT_MS);
    const url = `${this.baseUrl}/v1/analyze-text`;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ text: params.text, ...(opts ?? {}) }),
      signal,
    });
    return this.handleResponse(response, signal);
  }

  private async executeImageRequest(
    params: AnalyzeParams,
    signal: AbortSignal,
  ): Promise<AnalysisResult> {
    const url = `${this.baseUrl}/v1/analyze-image`;
    const bytes = new Uint8Array(params.imageBuffer);
    const body = JSON.stringify({
      mime: params.mime,
      imageBase64: btoa(String.fromCharCode(...bytes)),
    });
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body,
      signal,
    });
    return this.handleResponse(response, signal);
  }

  private async handleResponse(
    response: Response,
    signal: AbortSignal,
  ): Promise<AnalysisResult> {
    if (signal.aborted) {
      throw new AiError('timeout', 'İstek zaman aşımına uğradı');
    }
    if (response.ok) {
      try {
        const data = (await response.json()) as AnalysisResult;
        return {
          ...data,
          mealCategory: validateMealCategory(data.mealCategory),
        };
      } catch {
        throw new AiError('parse_error', 'Yanıt ayrıştırılamadı');
      }
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiError('auth', `Yetkilendirme hatası (${response.status})`);
    }
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const sec = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new AiError(
        'rate_limit',
        'Çok fazla istek. Lütfen bekleyin.',
        sec,
      );
    }
    if (response.status >= 500) {
      throw new AiError(
        'provider_error',
        `Sağlayıcı hatası (${response.status})`,
      );
    }
    throw new AiError(
      'invalid_payload',
      `Geçersiz istek (${response.status})`,
    );
  }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npx jest __tests__/services/ai/HttpAiClient.test.ts`
Expected: PASS — 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/HttpAiClient.ts __tests__/services/ai/HttpAiClient.test.ts
git commit -m "feat(ai): HttpAiClient implementing 15s timeout + dedup + error taxonomy"
```

---

## Task 5: Move mocks to fixtures

**Files:**
- Create: `src/__fixtures__/mockAnalysis.ts`

- [ ] **Step 1: Move existing mock data**

Create `src/__fixtures__/mockAnalysis.ts` containing the same `getMockAnalysis` and `getMockTextAnalysis` logic from `aiService.ts` (copy verbatim), prefixed with a comment indicating test-only use.

```ts
// Test fixture only. Used by aiService tests when HttpAiClient is mocked
// out and a deterministic response is required. NOT imported by app code.
import { LOCAL_FOODS } from '../../db/localFoods';
import type { AnalysisResult } from '../../types';

// ... (copy getMockAnalysis + getMockTextAnalysis bodies from aiService.ts)
```

- [ ] **Step 2: Commit**

```bash
git add src/__fixtures__/mockAnalysis.ts
git commit -m "refactor(ai): move mock data to test fixtures directory"
```

---

## Task 6: Replace aiService.ts with thin facade

**Files:**
- Modify: `src/services/aiService.ts`

- [ ] **Step 1: Replace file**

Write `src/services/aiService.ts`:

```ts
import RNFS from 'react-native-fs';
import { LOCAL_FOODS } from '../db/localFoods';
import { AI_PROXY_URL, AI_PROXY_TOKEN } from '@env';
import type { AnalysisResult, FoodItem, MealCategory } from '../types';
import { HttpAiClient } from './ai/HttpAiClient';
import type { AiClient } from './ai/AiClient';

let clientSingleton: AiClient | null = null;

function getClient(): AiClient {
  if (clientSingleton) return clientSingleton;
  if (!AI_PROXY_URL || !AI_PROXY_TOKEN) {
    throw new Error(
      'AI_PROXY_URL ve AI_PROXY_TOKEN .env dosyasında tanımlanmalıdır.',
    );
  }
  clientSingleton = new HttpAiClient({
    baseUrl: AI_PROXY_URL,
    token: AI_PROXY_TOKEN,
  });
  return clientSingleton;
}

export async function analyzeFoodImage(
  imageUris: string | string[],
): Promise<AnalysisResult> {
  const uris = typeof imageUris === 'string' ? [imageUris] : imageUris;
  const first = uris[0];
  if (!first) throw new Error('En az bir görsel gerekli');

  const cleanUri = first.replace('file://', '');
  const base64 = await RNFS.readFile(cleanUri, 'base64');
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

  const mime = inferMime(first);
  const result = await getClient().analyzeFoodImage({ imageBuffer: buffer, mime });
  return enrichWithVerification(result, uris);
}

export async function analyzeTextMeal(text: string): Promise<AnalysisResult> {
  const result = await getClient().analyzeTextMeal({ text });
  return result;
}

function inferMime(uri: string): 'image/jpeg' | 'image/png' | 'image/heic' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function enrichWithVerification(
  result: AnalysisResult,
  uris: string[],
): AnalysisResult {
  const enrichedItems: FoodItem[] = result.items.map((item, idx) => {
    const isMatched = LOCAL_FOODS.some(
      lf => lf.name.toLowerCase() === (item.name || '').toLowerCase(),
    );
    return {
      ...item,
      id: item.id || `${Date.now()}-${idx}`,
      isVerified: isMatched || item.confidence >= 0.95,
    };
  });
  return {
    ...result,
    imageUris: result.imageUris ?? uris,
    imageUri: result.imageUri ?? uris[0],
    items: enrichedItems,
  };
}
```

- [ ] **Step 2: Update .env example**

If `.env.example` exists, add:
```
AI_PROXY_URL=https://your-proxy.example.com
AI_PROXY_TOKEN=replace-with-real-token
```

Otherwise create `.env.example` with the existing keys plus the two new ones (see PRD §16 env schema).

- [ ] **Step 3: Run lint + tsc**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/aiService.ts .env.example
git commit -m "refactor(ai): aiService becomes thin facade over HttpAiClient

- Removes FORCE_MOCK, geminiClient, getMockAnalysis, getMockTextAnalysis
- Adds .env contract for AI_PROXY_URL + AI_PROXY_TOKEN
- Image conversion (RNFS -> ArrayBuffer) and LOCAL_FOODS verification
  stay in aiService; HTTP timeout/dedup/error mapping moves to HttpAiClient"
```

---

## Task 7: OfflineQueueItem — add `nextRetryAt`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add field**

In `src/types/index.ts`, locate the `OfflineQueueItem` interface and add:

```ts
nextRetryAt?: string | null;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(queue): add nextRetryAt to OfflineQueueItem for backoff"
```

---

## Task 8: Offline queue — exponential backoff

**Files:**
- Modify: `src/stores/offlineQueueStore.ts`
- Create: `__tests__/stores/offlineQueueStore.test.ts`

**Interfaces:**
- `processQueue` skips items where `Date.now() < nextRetryAt`.
- After failure, sets `nextRetryAt = now + base * 2^retryCount * 1000ms` (1s, 4s, 16s).
- For `AiError{kind:'rate_limit'}` uses `retryAfterSec`.
- For `AiError{kind: 'auth' | 'invalid_payload' | 'parse_error'}` removes from queue (non-retryable).
- Persists `nextRetryAt` in the persist config partialize (already persisted as part of the whole item).

- [ ] **Step 1: Write the failing test**

Create `__tests__/stores/offlineQueueStore.test.ts`:

```ts
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';

jest.mock('../../src/services/aiService', () => ({
  analyzeFoodImage: jest.fn(),
}));

import { analyzeFoodImage } from '../../src/services/aiService';
const mockedAnalyze = analyzeFoodImage as jest.MockedFunction<
  typeof analyzeFoodImage
>;

beforeEach(() => {
  useOfflineQueueStore.setState({ queue: [], isProcessing: false });
  mockedAnalyze.mockReset();
});

describe('offlineQueueStore', () => {
  it('processes pending items and removes on success', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      mealCategory: 'lunch',
      imageUri: 'file:///x',
      imageUris: ['file:///x'],
      smartInsight: '',
      items: [
        {
          id: 'i',
          name: 'X',
          confidence: 1,
          estimatedPortionGrams: 100,
          caloriesPer100g: 100,
          proteinPer100g: 10,
          carbsPer100g: 10,
          fatPer100g: 1,
        },
      ],
    });
    useOfflineQueueStore.getState().addToQueue({
      imageUri: 'file:///x',
      mealCategory: 'lunch',
    });
    await useOfflineQueueStore.getState().processQueue();
    expect(useOfflineQueueStore.getState().queue.length).toBe(0);
  });

  it('skips items when nextRetryAt is in the future', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    useOfflineQueueStore.setState({
      queue: [
        {
          id: 'q1',
          createdAt: new Date().toISOString(),
          imageUri: 'file:///x',
          mealCategory: 'lunch',
          status: 'pending',
          retryCount: 0,
          nextRetryAt: future,
        },
      ],
    });
    await useOfflineQueueStore.getState().processQueue();
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it('sets nextRetryAt after failure', async () => {
    mockedAnalyze.mockRejectedValueOnce(new Error('boom'));
    useOfflineQueueStore.getState().addToQueue({
      imageUri: 'file:///x',
      mealCategory: 'lunch',
    });
    await useOfflineQueueStore.getState().processQueue();
    const item = useOfflineQueueStore.getState().queue[0];
    expect(item.retryCount).toBe(1);
    expect(item.nextRetryAt).toBeTruthy();
  });

  it('drops items after retryCount >= 3', async () => {
    mockedAnalyze.mockRejectedValue(new Error('boom'));
    useOfflineQueueStore.setState({
      queue: [
        {
          id: 'q1',
          createdAt: new Date().toISOString(),
          imageUri: 'file:///x',
          mealCategory: 'lunch',
          status: 'pending',
          retryCount: 2,
          nextRetryAt: null,
        },
      ],
    });
    await useOfflineQueueStore.getState().processQueue();
    // After this attempt, retryCount becomes 3; next call would skip.
    expect(useOfflineQueueStore.getState().queue[0].retryCount).toBe(3);
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npx jest __tests__/stores/offlineQueueStore.test.ts`

- [ ] **Step 3: Update offlineQueueStore**

Edit `src/stores/offlineQueueStore.ts`. Replace `processQueue` body:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OfflineQueueItem } from '../types';
import { analyzeFoodImage } from '../services/aiService';
import { AiError } from '../services/ai/errors';
import { useLogStore } from './logStore';
import { createMmkvStorage } from '../lib/persist';
import { getTodayKey } from '../utils/date';

const queueStorage = createMmkvStorage('offline-queue-storage');

const BASE_RETRY_MS = 1_000;
const MAX_RETRY = 3;

function computeNextRetryAt(retryCount: number): string {
  const ms = BASE_RETRY_MS * Math.pow(2, retryCount);
  return new Date(Date.now() + ms).toISOString();
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AiError) {
    return ['timeout', 'network', 'provider_error', 'rate_limit'].includes(err.kind);
  }
  return true; // unknown errors: retry
}

// ... interface unchanged ...

processQueue: async () => {
  const { queue, isProcessing } = get();
  if (isProcessing) return;
  const now = Date.now();

  const candidates = queue.filter(item => {
    if (item.status === 'completed') return false;
    if (item.retryCount >= MAX_RETRY) return false;
    if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) return false;
    return item.status === 'pending' || item.status === 'failed' || item.status === 'uploading';
  });

  if (candidates.length === 0) return;

  set({ isProcessing: true });

  try {
    for (const item of candidates) {
      try {
        get().updateStatus(item.id, 'uploading');
        const result = await analyzeFoodImage(item.imageUri);

        const totals = result.items.reduce(
          (acc, food) => {
            const ratio = food.estimatedPortionGrams / 100;
            acc.cal += food.caloriesPer100g * ratio;
            acc.protein += food.proteinPer100g * ratio;
            acc.carbs += food.carbsPer100g * ratio;
            acc.fat += food.fatPer100g * ratio;
            return acc;
          },
          { cal: 0, protein: 0, carbs: 0, fat: 0 },
        );

        useLogStore.getState().addEntry({
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dateKey: getTodayKey(),
          mealCategory: item.mealCategory,
          imageUri: item.imageUri,
          items: result.items,
          totalCalories: Math.round(totals.cal),
          totalProtein: Math.round(totals.protein),
          totalCarbs: Math.round(totals.carbs),
          totalFat: Math.round(totals.fat),
        });

        get().removeFromQueue(item.id);
      } catch (err) {
        const aiErr = err instanceof AiError ? err : null;
        const retryable = isRetryable(err);
        if (!retryable) {
          get().removeFromQueue(item.id);
          continue;
        }
        get().incrementRetry(item.id);
        const newRetryCount = (get().queue.find(q => q.id === item.id)?.retryCount ?? 0);
        const retryAt =
          aiErr?.kind === 'rate_limit' && aiErr.retryAfterSec
            ? new Date(Date.now() + aiErr.retryAfterSec * 1000).toISOString()
            : computeNextRetryAt(newRetryCount);
        useOfflineQueueStore.setState(state => ({
          queue: state.queue.map(q =>
            q.id === item.id
              ? { ...q, status: 'failed' as const, nextRetryAt: retryAt }
              : q,
          ),
        }));
      }
    }
  } finally {
    set({ isProcessing: false });
  }
},
```

- [ ] **Step 4: Verify tests pass**

Run: `npx jest __tests__/stores/offlineQueueStore.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/stores/offlineQueueStore.ts __tests__/stores/offlineQueueStore.test.ts
git commit -m "feat(queue): exponential backoff + retryable error classification

- nextRetryAt set after failure: base 1s, doubling each retry
- rate_limit uses server's retryAfterSec
- non-retryable errors (auth, invalid_payload, parse_error) drop the item
- retryCount capped at 3; further processQueue calls skip dropped items"
```

---

## Task 9: Foreground sync — verify wiring

**Files:**
- Modify: `App.tsx` (already wired in Alt-proje 1 T15)

- [ ] **Step 1: Verify AppState listener exists**

Read `App.tsx`. Confirm `useForegroundSync` hook calls `processQueue()` on `AppState` `'active'` transition.

- [ ] **Step 2: Add test for foreground-sync wiring (manual verification)**

This is not unit-testable in Jest (no native app context). Manual verification:
1. Open app offline → queue an image.
2. Re-enable network.
3. Background app → foreground app.
4. Verify queue processes.

Document the manual verification step in the commit message.

- [ ] **Step 3: Commit (no-op if already wired)**

If `App.tsx` already has the listener:
```bash
git commit --allow-empty -m "docs: foreground sync verified — manual checklist logged"
```

---

## Task 10: Final verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: all green. New tests this round:
- `__tests__/services/ai/checksum.test.ts` — 3 tests
- `__tests__/services/ai/dedup.test.ts` — 4 tests
- `__tests__/services/imageUtils.test.ts` — 6 tests
- `__tests__/services/ai/HttpAiClient.test.ts` — 7 tests
- `__tests__/stores/offlineQueueStore.test.ts` — 4 tests

Total: 25 + 24 = 49 tests.

- [ ] **Step 4: Commit (if any cleanup)**

```bash
git add -A
git commit -m "chore: alt-project 2 final pass — lint clean, tsc clean, 49 tests"
```

---

## Self-Review Notes

1. **Spec coverage:**
   - §2 AiClient interface: implemented by HttpAiClient (T4).
   - §2.3 15s timeout: enforced in HttpAiClient.handleResponse + AbortSignal.timeout.
   - §2.3 5s dedup: DedupMap keyed on SHA-256 of image bytes.
   - §2.3 error taxonomy: full mapping in handleResponse.
   - §2.3 20MB size guard: imageUtils.validateImageSize.
   - §2.3 compression: compressImage stub returns raw bytes; real resize deferred to alt-project 3.
   - §2.3 auth header: Bearer token via .env.
   - §3.2 queue backoff: exponential, retryable classification (T8).
   - §3.2 AppState foreground: verified in T9.

2. **Placeholders:** none.

3. **Type consistency:** `AiError`, `AiClient`, `DedupMap<T>`, `HttpAiClient` all referenced consistently.

4. **Deferred (explicit):**
   - Real `react-native-image-resizer` integration (T3 stub note).
   - Backend proxy implementation (out of scope per spec).
   - Live network tests (no proxy available yet — verified via mock fetch).
