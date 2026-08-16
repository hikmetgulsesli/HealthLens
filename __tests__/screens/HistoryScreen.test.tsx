import React from 'react';
import { Alert } from 'react-native';
import { renderScreen } from '../test-utils/renderScreen';
import { resetAllStores } from '../test-utils/resetStores';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

import { HistoryScreen } from '../../src/screens/HistoryScreen';

describe('HistoryScreen', () => {
  beforeEach(() => {
    resetAllStores();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders without crashing and shows the heading', async () => {
    const r = await renderScreen(<HistoryScreen />);
    expect(r.findAllByText('Geçmiş').length).toBeGreaterThan(0);
    await r.unmount();
  });

  it('shows the 7-day trend panel text', async () => {
    const r = await renderScreen(<HistoryScreen />);
    expect(r.findAllByText('7 Günlük Trend').length).toBeGreaterThan(0);
    await r.unmount();
  });

  it('shows an empty-state hint when no log entry exists for the chosen day', async () => {
    const r = await renderScreen(<HistoryScreen />);
    expect(
      r.findAllByText('Bu tarih için kayıt yok').length,
    ).toBeGreaterThan(0);
    await r.unmount();
  });
});
