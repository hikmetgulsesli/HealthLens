import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  title: string;
  isBarcodeMode: boolean;
  onClose: () => void;
  onToggleVoice: () => void;
  onToggleBarcode: () => void;
}

export function CameraTopBar({
  title,
  isBarcodeMode,
  onClose,
  onToggleVoice,
  onToggleBarcode,
}: Props): React.JSX.Element {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onClose}
        testID="cameraCloseButton"
      >
        <Icon name="close" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.topBarRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleVoice}
          disabled={isBarcodeMode}
          testID="cameraVoiceButton"
        >
          <Icon
            name="mic"
            size={24}
            color={isBarcodeMode ? colors.outline : colors.onSurface}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, isBarcodeMode && styles.barcodeButtonActive]}
          onPress={onToggleBarcode}
          testID="cameraBarcodeButton"
        >
          <Icon
            name={isBarcodeMode ? 'qr-code-scanner' : 'qr-code'}
            size={24}
            color={isBarcodeMode ? colors.primary : colors.onSurface}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeButtonActive: {
    backgroundColor: `${colors.primary}22`,
  },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
