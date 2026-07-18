import type { AnalysisResult, MealCategory } from '../../types';

export interface AiRequestOptions {
  signal?: AbortSignal;
  language?: 'tr' | 'en';
  hint?: string;
  category?: MealCategory;
}

export interface AnalyzeParams {
  imageBuffer: ArrayBuffer;
  mime: 'image/jpeg' | 'image/png' | 'image/heic';
}

export interface AnalyzeTextParams {
  text: string;
}

export interface AiClient {
  analyzeFoodImage(
    params: AnalyzeParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;

  analyzeTextMeal(
    params: AnalyzeTextParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;
}

export const AI_TIMEOUT_MS = 15_000;
export const DEDUP_WINDOW_MS = 5_000;
