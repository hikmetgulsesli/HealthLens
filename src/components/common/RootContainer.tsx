import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * Centers content on wide screens (iPad, landscape).
 * Keeps the existing portrait design intact while preventing the chrome
 * from stretching awkwardly on tablet displays.
 */
interface Props {
  children: ReactNode;
  maxWidth?: number;
  background?: string;
}

const IPAD_BREAKPOINT = 600;

export function RootContainer({
  children,
  maxWidth = 480,
  background = colors.background,
}: Props): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isLarge = Platform.OS === 'ios' && width >= IPAD_BREAKPOINT;

  return (
    <View style={[styles.outer, { backgroundColor: background }]}>
      <View style={[styles.inner, isLarge && { ...styles.largeInner, maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  largeInner: {
    alignSelf: 'center',
    width: '100%',
  },
});
