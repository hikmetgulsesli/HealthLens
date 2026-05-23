import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          cameraType={CameraType.Back}
          flashMode={flashOn ? 'on' : 'off'}
          testID="cameraPreview"
        />
      </View>

      {/* Dark Overlays */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.title}>{tr.appName}</Text>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Icon name="settings" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Center Reticle */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{tr.camera.alignFood}</Text>
        </View>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>{tr.camera.processing}</Text>
        </View>
      )}

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Gallery */}
          <TouchableOpacity
            style={styles.sideButton}
            activeOpacity={0.7}
            onPress={handleGalleryPick}
          >
            <Icon name="photo-library" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
            testID="cameraCaptureButton"
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          {/* Flash */}
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
      </SafeAreaView>
    </View>
  );
}

const RETICLE_SIZE = 280;
const CORNER_SIZE = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  camera: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.surface, 0.5),
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  reticleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radii.lg,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radii.lg,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radii.lg,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radii.lg,
  },
  statusPill: {
    position: 'absolute',
    bottom: '30%',
    alignSelf: 'center',
    backgroundColor: withAlpha(colors.surface, 0.9),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.background, 0.85),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurface,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
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
    backgroundColor: withAlpha(colors.surface, 0.6),
    borderWidth: 1,
    borderColor: withAlpha(colors.onSurface, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: withAlpha(colors.onSurface, 0.3),
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onSurface,
  },
});
