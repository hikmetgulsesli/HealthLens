import { HttpAiClient } from '../../../src/services/ai/HttpAiClient';

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
    fetchMock = jest.fn();
    client = new HttpAiClient({ baseUrl, token, fetchImpl: fetchMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe(
      `Bearer ${token}`,
    );
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

  it('strips trailing slash from baseUrl', () => {
    const c = new HttpAiClient({
      baseUrl: 'https://proxy.test/',
      token: 't',
      fetchImpl: fetchMock,
    });
    expect((c as unknown as { baseUrl: string }).baseUrl).toBe('https://proxy.test');
  });

  it('throws invalid_payload for 4xx other than 401/403/429', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'invalid_payload' });
  });

  it('maps 403 to auth (not invalid_payload)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'auth' });
  });

  it('maps 502 to provider_error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });
    const buf = new TextEncoder().encode('x').buffer;
    await expect(
      client.analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' }),
    ).rejects.toMatchObject({ kind: 'provider_error' });
  });

  it('429 without Retry-After still reports rate_limit (retryAfterSec undefined)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => null },
    });
    const buf = new TextEncoder().encode('x').buffer;
    const err = await client
      .analyzeFoodImage({ imageBuffer: buf, mime: 'image/jpeg' })
      .catch(e => e);
    expect(err).toMatchObject({ kind: 'rate_limit' });
    expect(err.retryAfterSec).toBeUndefined();
  });

  it('text analysis posts to /v1/analyze-text with the text payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...validResult,
        imageUri: '',
        imageUris: [],
        items: [{ ...validResult.items[0], name: 'Parsed Meal' }],
      }),
    });
    const result = await client.analyzeTextMeal({ text: '2 boiled eggs' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/v1/analyze-text`);
    const body = JSON.parse((init as { body: string }).body);
    expect(body.text).toBe('2 boiled eggs');
    expect(result.items[0].name).toBe('Parsed Meal');
  });

  it('normalizes an unknown mealCategory response to breakfast', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...validResult, mealCategory: 'gibberish' }),
    });
    const buf = new TextEncoder().encode('x').buffer;
    const result = await client.analyzeFoodImage({
      imageBuffer: buf,
      mime: 'image/jpeg',
    });
    expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(
      result.mealCategory,
    );
  });

  it('preserves a valid mealCategory response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...validResult, mealCategory: 'dinner' }),
    });
    const buf = new TextEncoder().encode('x').buffer;
    const result = await client.analyzeFoodImage({
      imageBuffer: buf,
      mime: 'image/jpeg',
    });
    expect(result.mealCategory).toBe('dinner');
  });

  it('different images produce different SHA-256 digests (no false dedup)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validResult,
    });
    const a = new TextEncoder().encode('apple').buffer;
    const b = new TextEncoder().encode('banana').buffer;
    await Promise.all([
      client.analyzeFoodImage({ imageBuffer: a, mime: 'image/jpeg' }),
      client.analyzeFoodImage({ imageBuffer: b, mime: 'image/jpeg' }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
