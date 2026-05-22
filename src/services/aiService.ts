import { GoogleGenAI } from '@google/genai';
import type { AnalysisResult, MealCategory } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_PROMPT = `You are a food recognition AI. Analyze the food image and return ONLY a JSON object with this exact structure:
{
  "items": [
    {
      "name": "Food name in Turkish",
      "confidence": 0.95,
      "estimatedPortionGrams": 250,
      "caloriesPer100g": 85,
      "proteinPer100g": 4.5,
      "carbsPer100g": 12,
      "fatPer100g": 2.1,
      "fiberPer100g": 3.2,
      "sugarPer100g": 1.5,
      "sodiumPer100g": 0.4
    }
  ],
  "mealCategory": "breakfast"
}

Meal categories: breakfast, lunch, dinner, snack
Confidence should be between 0 and 1
All nutritional values are per 100g
Return ONLY the JSON, no markdown, no explanation.`;

export async function analyzeFoodImage(
  imageUri: string,
): Promise<AnalysisResult> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await imageToBase64(imageUri),
              },
            },
          ],
        },
      ],
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from AI');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      imageUri,
      mealCategory: validateMealCategory(parsed.mealCategory),
      items: parsed.items.map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        name: item.name || 'Bilinmeyen Yiyecek',
        confidence: Math.min(Math.max(item.confidence || 0.5, 0), 1),
        estimatedPortionGrams: item.estimatedPortionGrams || 100,
        caloriesPer100g: item.caloriesPer100g || 0,
        proteinPer100g: item.proteinPer100g || 0,
        carbsPer100g: item.carbsPer100g || 0,
        fatPer100g: item.fatPer100g || 0,
        fiberPer100g: item.fiberPer100g,
        sugarPer100g: item.sugarPer100g,
        sodiumPer100g: item.sodiumPer100g,
      })),
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    throw error;
  }
}

async function imageToBase64(uri: string): Promise<string> {
  const RNFS = require('react-native-fs');
  const base64 = await RNFS.readFile(uri, 'base64');
  return base64;
}

function validateMealCategory(cat: string): MealCategory {
  const valid: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  return valid.includes(cat as MealCategory)
    ? (cat as MealCategory)
    : 'breakfast';
}

export function getMockAnalysis(imageUri: string): AnalysisResult {
  return {
    imageUri,
    mealCategory: 'breakfast',
    items: [
      {
        id: '1',
        name: 'Mercimek Çorbası',
        confidence: 0.92,
        estimatedPortionGrams: 250,
        caloriesPer100g: 85,
        proteinPer100g: 4.5,
        carbsPer100g: 12,
        fatPer100g: 2.1,
      },
    ],
  };
}
