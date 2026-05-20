import {create} from 'zustand';
import type {AnalysisResult, MealCategory} from '../types';

interface AnalysisState {
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setAnalyzing: (val: boolean) => void;
  updateItemPortion: (itemId: string, grams: number) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: AnalysisResult['items'][0]) => void;
  setMealCategory: (cat: MealCategory) => void;
}

export const useAnalysisStore = create<AnalysisState>(set => ({
  currentAnalysis: null,
  isAnalyzing: false,
  setAnalysis: analysis => set({currentAnalysis: analysis}),
  setAnalyzing: val => set({isAnalyzing: val}),
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
}));
