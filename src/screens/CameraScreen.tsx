import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { typography, fontFamily } from '../theme/typography';
import { useAnalysisStore } from '../stores/analysisStore';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { tr } from '../i18n';
import { analyzeFoodImage, getMockAnalysis } from '../services/aiService';
import { saveImage } from '../utils/imageStorage';

export function CameraScreen(): React.JSX.Element {
  const cameraRef = useRef<any>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const setAnalyzing = useAnalysisStore(s => s.setAnalyzing);
  const addToQueue = useOfflineQueueStore(s => s.addToQueue);

  const handleCapture = async () => {
    try {
      setAnalyzing(true);
      setIsProcessing(true);

      const image = await cameraRef.current?.capture?.();
      if (!image?.uri) {
        throw new Error('Failed to capture image');
      }

      const savedUri = await saveImage(image.uri);

      try {
        const result = await analyzeFoodImage(savedUri);
        setAnalysis(result);
      } catch (error) {
        console.warn('AI analysis failed, using mock data:', error);
        addToQueue({
          imageUri: savedUri,
          mealCategory: 'breakfast',
        });
        setAnalysis(getMockAnalysis(savedUri));
      }

      setAnalyzing(false);
      setIsProcessing(false);
      navigation.navigate('Review');
    } catch {
      Alert.alert(tr.camera.errorTitle || 'Hata', tr.camera.captureError);
      setAnalyzing(false);
      setIsProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]?.uri) {
        return;
      }

      setAnalyzing(true);
      setIsProcessing(true);

      const sourceUri = result.assets[0].uri;
      const savedUri = await saveImage(sourceUri);

      try {
        const analysisResult = await analyzeFoodImage(savedUri);
        setAnalysis(analysisResult);
      } catch (error) {
        console.warn('AI analysis failed, using mock data:', error);
        addToQueue({
          imageUri: savedUri,
          mealCategory: 'breakfast',
        });
        setAnalysis(getMockAnalysis(savedUri));
      }

      setAnalyzing(false);
      setIsProcessing(false);
      navigation.navigate('Review');
    } catch {
      Alert.alert(
        tr.camera.errorTitle || 'Hata',
        tr.camera.galleryError || 'Galeriden fotoğraf seçilemedi.',
      );
      setAnalyzing(false);
      setIsProcessing(false);
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
          <Icon name="close" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{tr.appName}</Text>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Icon name="settings" size={24} color={colors.primary} />
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
          <Text style={styles.statusText}>{tr.camera.alignFood}</Text>
        </View>
      </View>

      {/* Bottom Controls Area */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>{tr.camera.processing}</Text>
        </View>
      )}

      {/* Bottom Controls Area */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Gallery Shortcut */}
          <TouchableOpacity
            style={styles.sideButton}
            activeOpacity={0.7}
            onPress={handleGalleryPick}
          >
            <Icon name="photo-library" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          {/* Main Capture Button */}
          <TouchableOpacity
            style={styles.captureButtonWrap}
            onPress={handleCapture}
            activeOpacity={0.8}
            testID="cameraCaptureButton"
          >
            <View style={styles.captureOuterRing} />
            <View style={styles.captureInnerFill} />
          </TouchableOpacity>

          {/* Flash Toggle */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFlashOn(v => !v)}
            activeOpacity={0.7}
          >
            <Icon
              name={flashOn ? 'flash-on' : 'flash-off'}
              size={24}
              color={flashOn ? colors.primary : colors.onSurface}
            />
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
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
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
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.background, 0.8),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.onSurface,
  },
});
