import { useAnalysisStore } from '../../src/stores/analysisStore';
import type { AnalysisResult } from '../../src/types';

describe('analysisStore edit-mode state', () => {
  beforeEach(() => {
    useAnalysisStore.setState({
      currentAnalysis: null,
      isAnalyzing: false,
      imageUris: [],
    });
  });

  it('is in edit mode when analysis.id is set', () => {
    const entry: AnalysisResult = {
      id: 'entry-123',
      items: [],
      mealCategory: 'lunch',
      dateKey: '2026-08-16',
      createdAt: new Date().toISOString(),
      imageUri: 'file:///x.jpg',
      imageUris: ['file:///x.jpg'],
      smartInsight: 'Kaydedilmiş öğün düzenleniyor.',
    };

    useAnalysisStore.getState().setAnalysis(entry);

    const analysis = useAnalysisStore.getState().currentAnalysis;
    expect(analysis?.id).toBe('entry-123');
    expect(useAnalysisStore.getState().imageUris).toContain('file:///x.jpg');
  });

  it('preserves prior imageUris when setAnalysis is called without imageUris', () => {
    useAnalysisStore.getState().addImageUri('file:///prior.jpg');

    useAnalysisStore.getState().setAnalysis({
      items: [],
      mealCategory: 'snack',
    });

    expect(useAnalysisStore.getState().imageUris).toContain('file:///prior.jpg');
  });
});
