import {create} from 'zustand';
import type {AnalysisResult, MealCategory} from '../types';

interface AnalysisState {
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  imageUris: string[];
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setAnalyzing: (val: boolean) => void;
  addImageUri: (uri: string) => void;
  removeImageUri: (uri: string) => void;
  updateItemPortion: (itemId: string, grams: number) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: AnalysisResult['items'][0]) => void;
  setMealCategory: (cat: MealCategory) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>(set => ({
  currentAnalysis: null,
  isAnalyzing: false,
  imageUris: [],
  setAnalysis: analysis =>
    set(state => ({
      currentAnalysis: analysis,
      imageUris: analysis?.imageUris || (analysis?.imageUri ? [analysis.imageUri] : state.imageUris),
    })),
  setAnalyzing: val => set({isAnalyzing: val}),
  addImageUri: uri => set(state => ({imageUris: [...state.imageUris, uri]})),
  removeImageUri: uri =>
    set(state => ({imageUris: state.imageUris.filter(u => u !== uri)})),
  updateItemPortion: (itemId, grams) =>
    set(state => {
      if (!state.currentAnalysis) return state;
      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          items: state.currentAnalysis.items.map(item =>
            item.id === itemId
              ? {...item, estimatedPortionGrams: grams}
              : item,
          ),
        },
      };
    }),
  removeItem: itemId =>
    set(state => {
      if (!state.currentAnalysis) return state;
      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          items: state.currentAnalysis.items.filter(i => i.id !== itemId),
        },
      };
    }),
  addItem: item =>
    set(state => {
      if (!state.currentAnalysis) return state;
      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          items: [...state.currentAnalysis.items, item],
        },
      };
    }),
  setMealCategory: cat =>
    set(state => {
      if (!state.currentAnalysis) return state;
      return {
        currentAnalysis: {...state.currentAnalysis, mealCategory: cat},
      };
    }),
  reset: () => set({currentAnalysis: null, isAnalyzing: false, imageUris: []}),
}));
