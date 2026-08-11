import type { AiClient, AnalyzeParams, AnalyzeTextParams, AiRequestOptions } from './AiClient';
import { AI_TIMEOUT_MS, DEDUP_WINDOW_MS } from './AiClient';
import { AiError } from './errors';
import { sha256 } from './checksum';
import { DedupMap } from './dedup';
import type { AnalysisResult, MealCategory } from '../../types';

export interface HttpAiClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl: typeof fetch;
  dedupMap?: DedupMap<AnalysisResult>;
}

const VALID_MEAL_CATEGORIES: MealCategory[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

function createTimeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

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
    this.fetchImpl = opts.fetchImpl;
    this.dedupMap =
      opts.dedupMap ?? new DedupMap<AnalysisResult>({ windowMs: DEDUP_WINDOW_MS });
  }

  async analyzeFoodImage(
    params: AnalyzeParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult> {
    const checksum = await sha256(params.imageBuffer);
    const inflight = this.dedupMap.get(checksum);
    if (inflight) return inflight;

    const signal = opts?.signal ?? createTimeoutSignal(AI_TIMEOUT_MS);
    const promise = this.executeImageRequest(params, signal);
    this.dedupMap.set(checksum, promise);
    try {
      return await promise;
    } catch (err) {
      if (signal.aborted) this.dedupMap.clear();
      throw err;
    }
  }

  async analyzeTextMeal(
    params: AnalyzeTextParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult> {
    const signal = opts?.signal ?? createTimeoutSignal(AI_TIMEOUT_MS);
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
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const body = JSON.stringify({
      mime: params.mime,
      imageBase64: btoa(binary),
    });
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body,
        signal,
      });
    } catch (err) {
      if (signal.aborted || (err as Error).name === 'AbortError') {
        throw new AiError('timeout', 'İstek zaman aşımına uğradı');
      }
      throw new AiError('network', 'Ağ hatası');
    }
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
      throw new AiError('rate_limit', 'Çok fazla istek. Lütfen bekleyin.', sec);
    }
    if (response.status >= 500) {
      throw new AiError('provider_error', `Sağlayıcı hatası (${response.status})`);
    }
    throw new AiError('invalid_payload', `Geçersiz istek (${response.status})`);
  }
}
