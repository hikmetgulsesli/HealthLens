import RNFS from 'react-native-fs';
import { LOCAL_FOODS } from '../db/localFoods';
import { AI_PROXY_URL, AI_PROXY_TOKEN } from '@env';
import type { AnalysisResult, FoodItem } from '../types';
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
    fetchImpl: fetch.bind(globalThis),
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
  return getClient().analyzeTextMeal({ text });
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