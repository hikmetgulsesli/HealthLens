import React, {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {colors, withAlpha} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radii} from '../theme/radii';
import {typography, fontFamily} from '../theme/typography';
import {useAnalysisStore} from '../stores/analysisStore';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

export function CameraScreen(): React.JSX.Element {
  const cameraRef = useRef<any>(null);
  const [flashOn, setFlashOn] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const setAnalyzing = useAnalysisStore(s => s.setAnalyzing);

  const handleCapture = async () => {
    try {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalysis({
          imageUri: 'mock://captured-image',
          mealCategory: 'breakfast',
          items: [
            {
              id: '1',
              name: 'Mercimek Çorbası',
              confidence: 0.92,
              estimatedPortionGrams: 250,
              caloriesPer100g: 85,
              proteinPer100g: 4.5,
              carbsPer100g: 12,
              fatPer100g: 2.1,
            },
          ],
        });
        setAnalyzing(false);
        navigation.navigate('Review');
      }, 1500);
    } catch {
      Alert.alert('Hata', 'Fotoğraf çekilemedi.');
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Viewport Background */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        cameraType={CameraType.Back}
        flashMode={flashOn ? 'on' : 'off'}
        testID="cameraPreview"
      />

      {/* Subtle dark overlay */}
      <View style={styles.overlay} />

      {/* TopAppBar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HealthLens</Text>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Text style={styles.iconText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Scanning Canvas (Middle) */}
      <View style={styles.scanningCanvas}>
        {/* Focus Reticle */}
        <View style={styles.reticle}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {/* Crosshair center */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
          </View>
        </View>

        {/* Scanning Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Align food in frame</Text>
        </View>
      </View>

      {/* Bottom Controls Area */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Gallery Shortcut */}
          <TouchableOpacity style={styles.sideButton} activeOpacity={0.7}>
            <Text style={styles.sideIcon}>🖼</Text>
          </TouchableOpacity>

          {/* Main Capture Button */}
          <TouchableOpacity
            style={styles.captureButtonWrap}
            onPress={handleCapture}
            activeOpacity={0.8}
            testID="cameraCaptureButton">
            <View style={styles.captureOuterRing} />
            <View style={styles.captureInnerFill} />
          </TouchableOpacity>

          {/* Flash Toggle */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFlashOn(v => !v)}
            activeOpacity={0.7}>
            <Text style={[styles.sideIcon, flashOn && styles.flashActive]}>
              ⚡
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.background, 0.2),
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.sm,
    backgroundColor: withAlpha(colors.surface, 0.4),
    borderBottomWidth: 1,
    borderBottomColor: withAlpha('#ffffff', 0.1),
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: typography['labelMd'].fontWeight,
  },
  title: {
    ...typography['headlineMd'],
    color: colors.primary,
    fontFamily: fontFamily.headline,
  },
  scanningCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  reticle: {
    width: 256,
    height: 256,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.primary, 0.5),
    borderRadius: radii.xl,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: -spacing.xs,
    left: -spacing.xs,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: radii.DEFAULT,
  },
  cornerTR: {
    top: -spacing.xs,
    right: -spacing.xs,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: radii.DEFAULT,
  },
  cornerBL: {
    bottom: -spacing.xs,
    left: -spacing.xs,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: radii.DEFAULT,
  },
  cornerBR: {
    bottom: -spacing.xs,
    right: -spacing.xs,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: radii.DEFAULT,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    opacity: 0.4,
  },
  crosshairH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.primaryFixedDim,
  },
  crosshairV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.primaryFixedDim,
  },
  statusPill: {
    position: 'absolute',
    bottom: '25%',
    left: '50%',
    marginLeft: -80,
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.8),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: withAlpha('#475569', 0.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  statusText: {
    ...typography['labelMd'],
    color: colors.onSurface,
  },
  bottomControls: {
    zIndex: 20,
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: withAlpha(colors.surfaceVariant, 0.4),
    borderWidth: 1,
    borderColor: withAlpha('#ffffff', 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIcon: {
    color: colors.onSurface,
    fontSize: 24,
  },
  flashActive: {
    color: colors.primary,
  },
  captureButtonWrap: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuterRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: withAlpha('#ffffff', 0.8),
  },
  captureInnerFill: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
