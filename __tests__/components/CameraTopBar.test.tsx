/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { CameraTopBar } from '../../src/components/camera/CameraTopBar';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('CameraTopBar', () => {
  it('renders all 4 buttons (close, voice, barcode, optional title)', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <CameraTopBar
          title="HealthLens"
          isBarcodeMode={false}
          onClose={jest.fn()}
          onToggleVoice={jest.fn()}
          onToggleBarcode={jest.fn()}
        />,
      );
      await flushAsync();
    });
    expect(
      tree!.root.findAll(
        n => (n.props as { testID?: string })?.testID === 'cameraCloseButton',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      tree!.root.findAll(
        n => (n.props as { testID?: string })?.testID === 'cameraVoiceButton',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      tree!.root.findAll(
        n => (n.props as { testID?: string })?.testID === 'cameraBarcodeButton',
      ).length,
    ).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('invokes onClose / onToggleVoice / onToggleBarcode handlers', async () => {
    const onClose = jest.fn();
    const onToggleVoice = jest.fn();
    const onToggleBarcode = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <CameraTopBar
          title="X"
          isBarcodeMode={false}
          onClose={onClose}
          onToggleVoice={onToggleVoice}
          onToggleBarcode={onToggleBarcode}
        />,
      );
      await flushAsync();
    });
    act(() => {
      (tree!.root.findAllByProps({ testID: 'cameraCloseButton' })[0]
        .props as { onPress?: () => void }).onPress?.();
    });
    act(() => {
      (tree!.root.findAllByProps({ testID: 'cameraVoiceButton' })[0]
        .props as { onPress?: () => void }).onPress?.();
    });
    act(() => {
      (tree!.root.findAllByProps({ testID: 'cameraBarcodeButton' })[0]
        .props as { onPress?: () => void }).onPress?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onToggleVoice).toHaveBeenCalledTimes(1);
    expect(onToggleBarcode).toHaveBeenCalledTimes(1);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
