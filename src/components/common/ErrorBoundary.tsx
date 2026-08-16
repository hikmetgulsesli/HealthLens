import React, { type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level ErrorBoundary for the navigation tree.
 *
 * Catches render-time exceptions across the whole NavigationContainer so a
 *   crash inside one screen does not white-screen the app. The fallback lets
 *   the user retry without a full process restart.
 *
 * PRD §13 requires the app not to crash on malformed AI responses; this
 * complements that requirement by isolating any other UI render failures.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (!error) return children;

    if (fallback) {
      return fallback(error, this.reset);
    }

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Bir sorun oluştu</Text>
        <Text style={styles.message} numberOfLines={6}>
          {error.message}
        </Text>
        <TouchableOpacity
          style={styles.retry}
          onPress={this.reset}
          testID="errorBoundaryRetry"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  heading: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retry: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
