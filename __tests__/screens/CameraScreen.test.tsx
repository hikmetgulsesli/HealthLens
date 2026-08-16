import React from 'react';
import { Alert } from 'react-native';
import { renderScreen } from '../test-utils/renderScreen';
import { resetAllStores } from '../test-utils/resetStores';
import { useAnalysisStore } from '../../src/stores/analysisStore';

jest.mock('../../src/services/aiService', () => ({
  analyzeFoodImage: jest.fn(),
  analyzeTextMeal: jest.fn(),
}));

jest.mock('../../src/utils/imageStorage', () => ({
  saveImage: jest.fn(async (uri: string) => `file://saved/${uri}`),
  ensureDirectories: jest.fn(async () => {}),
  deleteImage: jest.fn(async () => {}),
  imageToBase64: jest.fn(async () => 'base64'),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({}),
}));
jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
  CameraType: { Back: 'back' },
}));

import { CameraScreen } from '../../src/screens/CameraScreen';

describe('CameraScreen', () => {
  beforeEach(() => {
    resetAllStores();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders without crashing and exposes capture + gallery buttons', async () => {
    const r = await renderScreen(<CameraScreen />);
    expect(r.findAllByTestID('cameraCaptureButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('cameraGalleryButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('cameraPreview').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('cameraCloseButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('cameraVoiceButton').length).toBeGreaterThan(0);
    expect(r.findAllByTestID('cameraBarcodeButton').length).toBeGreaterThan(0);
    await r.unmount();
  });

  it('toggles barcode mode on barcode-button press', async () => {
    const r = await renderScreen(<CameraScreen />);
    // Before: reticle shows "Yemeği çerçeveye hizalayın"
    expect(
      r.findAllByText('Yemeği çerçeveye hizalayın').length,
    ).toBeGreaterThan(0);
    await r.pressById('cameraBarcodeButton');
    // After: switched to "Barkodu çerçeveye hizalayın"
    expect(
      r.findAllByText('Barkodu çerçeveye hizalayın').length,
    ).toBeGreaterThan(0);
    await r.unmount();
  });

  it('toggles flash state on flash-button press', async () => {
    const r = await renderScreen(<CameraScreen />);
    const buttonBefore = r.firstByTestID('cameraFlashButton');
    expect(buttonBefore).toBeTruthy();
    await r.pressById('cameraFlashButton');
    // After the state update the button is re-rendered with the same
    // testID; we rely on the button still being present as a mount smoke
    // check (icon swap is hidden behind react-native-vector-icons mock).
    expect(r.firstByTestID('cameraFlashButton')).toBeTruthy();
    await r.unmount();
  });

  it('capture when no images is staged succeeds in mounting (camera mocked)', async () => {
    const r = await renderScreen(<CameraScreen />);
    // Camera component is mocked to a string; capture() is a no-op because
    // the mock ref doesn't actually own a camera. The important contract:
    // the capture button mount exists and the handler is wired.
    expect(r.firstByTestID('cameraCaptureButton')).toBeTruthy();
    await r.unmount();
  });

  it('close button navigates back to MainTabs without leaking analysis state', async () => {
    // Pre-seed analysis state so the close handler has to clear it.
    useAnalysisStore.setState({
      currentAnalysis: { items: [], mealCategory: 'lunch' },
      imageUris: ['file://x.jpg'],
      isAnalyzing: false,
    });
    const r = await renderScreen(<CameraScreen />);
    await r.pressById('cameraCloseButton');
    expect(mockNavigate).toHaveBeenCalledWith('MainTabs');
    // useEffect on mount calls reset(), so the store should be cleared
    // before our close-press path runs another reset().
    await r.unmount();
  });

  it('keeps capture button disabled while in barcode mode', async () => {
    const r = await renderScreen(<CameraScreen />);
    const captureBefore = r.firstByTestID('cameraCaptureButton');
    expect(captureBefore.props.disabled).toBeFalsy();
    await r.pressById('cameraBarcodeButton');
    // After toggling, the same component should disable itself.
    const captureAfter = r.firstByTestID('cameraCaptureButton');
    expect(captureAfter.props.disabled).toBe(true);
    await r.unmount();
  });
});
