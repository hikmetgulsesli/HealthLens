import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';

interface Props {
  onPress: () => void;
  bottom?: number;
  right?: number;
}

export function CameraFab({
  onPress,
  bottom = 24,
  right = 24,
}: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom, right }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Icon name="photo-camera" size={24} color={colors.onPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
