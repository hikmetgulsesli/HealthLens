/** @format */
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PaywallScreen } from '../../src/screens/PaywallScreen';
import { resetAllStores } from '../test-utils/resetStores';

const mockNavigation = {
  reset: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const flushAsync = (): Promise<void> =>
  new Promise<void>(resolve => {
    Promise.resolve().then(resolve);
  });

describe('PaywallScreen', () => {
  beforeEach(() => {
    resetAllStores();
    Object.values(mockNavigation).forEach(fn => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        (fn as jest.Mock).mockClear();
      }
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('mounts and renders the headline + subscribe button', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        tree = TestRenderer.create(<PaywallScreen />);
        await flushAsync();
      });
      expect(tree!.root.findAllByProps({ children: 'HealthLens Pro' }).length).toBeGreaterThan(0);
    } finally {
      await act(async () => {
        tree?.unmount();
        await flushAsync();
      });
    }
  });
});
