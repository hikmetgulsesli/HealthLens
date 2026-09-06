/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { CameraFab } from '../../src/components/dashboard/CameraFab';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('CameraFab', () => {
  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<CameraFab onPress={onPress} />);
      await flushAsync();
    });
    const fab = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardCameraFab',
    )[0];
    expect(fab).toBeTruthy();
    act(() => {
      (fab.props as { onPress?: () => void }).onPress?.();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
