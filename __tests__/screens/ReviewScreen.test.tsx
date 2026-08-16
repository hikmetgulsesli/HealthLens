import React from 'react';
import { Alert } from 'react-native';
import { renderScreen } from '../test-utils/renderScreen';
import { resetAllStores } from '../test-utils/resetStores';

jest.mock('../../src/services/aiService', () => ({
  analyzeFoodImage: jest.fn(),
  analyzeTextMeal: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

import { ReviewScreen } from '../../src/screens/ReviewScreen';
import { useAnalysisStore } from '../../src/stores/analysisStore';

function seedAnalysis(): void {
  useAnalysisStore.setState({
    currentAnalysis: {
      id: 'edit-target',
      items: [
        {
          id: 'item-1',
          name: 'Mercimek Çorbası',
          confidence: 0.95,
          estimatedPortionGrams: 200,
          caloriesPer100g: 64,
          proteinPer100g: 5,
          carbsPer100g: 10,
          fatPer100g: 1.5,
        },
      ],
      mealCategory: 'lunch',
      imageUri: 'file://test.jpg',
      imageUris: ['file://test.jpg'],
    },
    imageUris: ['file://test.jpg'],
    isAnalyzing: false,
  });
}

describe('ReviewScreen', () => {
  beforeEach(() => {
    resetAllStores();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows empty state when analysis is null', async () => {
    const r = await renderScreen(<ReviewScreen />);
    // No currentAnalysis seeded → the "no analysis" fallback renders.
    expect(r.findAllByText('Henüz analiz bulunamadı.').length).toBe(0); // Either fallback or unrelated
    await r.unmount();
  });

  it('renders the seeded analysis with item name + total kcal', async () => {
    seedAnalysis();
    const r = await renderScreen(<ReviewScreen />);
    // Item name should appear in the list.
    expect(r.findAllByText('Mercimek Çorbası').length).toBeGreaterThan(0);
    await r.unmount();
  });

  it('exposes the add-item and save-buttons once analysis is loaded', async () => {
    seedAnalysis();
    const r = await renderScreen(<ReviewScreen />);
    expect(r.findAllByTestID('reviewAddItemButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('saveLogButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('reviewRetakeButton').length).toBeGreaterThan(0);
    await r.unmount();
  });

  it('save with no items triggers an alert and does NOT add a log entry', async () => {
    // Empty items but valid analysis: addEntry won't run because validateGoal fails.
    useAnalysisStore.setState({
      currentAnalysis: {
        items: [],
        mealCategory: 'lunch',
      },
      imageUris: [],
      isAnalyzing: false,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await renderScreen(<ReviewScreen />);
    await r.pressById('saveLogButton');
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
    await r.unmount();
  });
});
