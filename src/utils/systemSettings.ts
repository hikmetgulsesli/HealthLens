import { Alert, Linking, Platform } from 'react-native';

export type SettingsTarget = 'app' | 'camera' | 'photos';

/**
 * Open iOS system Settings for the relevant permission. On Android only the
 * app-level settings page is reliably reachable; deeper scopes fall back to it.
 */
export async function openSystemSettings(
  target: SettingsTarget = 'app',
): Promise<void> {
  const url =
    Platform.OS === 'ios'
      ? target === 'app'
        ? 'app-settings:'
        : 'app-settings:' // iOS does not expose per-permission deep links
      : `package:${'com.hikmetgulsesli.healthlens'}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Ayarlar açılamadı',
        'Lütfen Ayarlar > HealthLens üzerinden ilgili izni açın.',
      );
    }
  } catch {
    Alert.alert(
      'Ayarlar açılamadı',
      'Lütfen Ayarlar > HealthLens üzerinden ilgili izni açın.',
    );
  }
}
