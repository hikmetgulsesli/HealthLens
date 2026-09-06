import { Alert, Linking } from 'react-native';
import { openSystemSettings } from '../../src/utils/systemSettings';

describe('openSystemSettings', () => {
  let alertSpy: jest.SpyInstance;
  let canOpenSpy: jest.SpyInstance;
  let openUrlSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true as never);
    openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    canOpenSpy.mockRestore();
    openUrlSpy.mockRestore();
  });

  it('opens the iOS app-settings URL on iOS', async () => {
    await openSystemSettings('app');
    expect(canOpenSpy).toHaveBeenCalledWith('app-settings:');
    expect(openUrlSpy).toHaveBeenCalledWith('app-settings:');
  });

  it('falls back to an alert when the URL scheme is unsupported', async () => {
    canOpenSpy.mockResolvedValueOnce(false as never);
    await openSystemSettings('app');
    expect(openUrlSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it('still surfaces a friendly alert when openURL throws', async () => {
    openUrlSpy.mockRejectedValueOnce(new Error('boom'));
    await openSystemSettings('app');
    expect(alertSpy).toHaveBeenCalled();
  });
});
