import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import type { CameraApi } from 'react-native-camera-kit/dist/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useAnalysisStore } from '../stores/analysisStore';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';
import { useUserStore } from '../stores/userStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { tr } from '../i18n';
import { analyzeFoodImage, getMockAnalysis, analyzeTextMeal } from '../services/aiService';
import { saveImage } from '../utils/imageStorage';
import { findFoodByBarcode } from '../db/localFoods';

export function CameraScreen(): React.JSX.Element {
  const cameraRef = useRef<CameraApi>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const canScan = useUserStore(s => s.canScan);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Tier-based quota:
  //   free:     3 AI scans / day
  //   pro:      100 AI scans / day (soft cap, abuse guard)
  //   pro_plus: unlimited (and active trial)
  //   trial:    treated as pro_plus
  const checkPremiumLimit = (): boolean => {
    const result = canScan(3, 100);
    if (!result.allowed) {
      Alert.alert(
        'Günlük Limit Doldu',
        result.reason ?? 'Günlük AI tarama limitinize ulaştınız.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Pro\'ya Geç', onPress: () => navigation.navigate('Paywall') },
        ],
      );
      return false;
    }
    return true;
  };

  const handleManualAdd = () => {
    setAnalysis({
      imageUris: [],
      mealCategory: 'breakfast',
      items: [],
      smartInsight: 'Manuel olarak besin ekliyorsunuz. Akıllı analiz aktif değil.',
    });
    navigation.navigate('Review');
  };
  
  const handleVoiceAnalyze = async () => {
    if (!voiceText.trim()) return;
    if (!checkPremiumLimit()) return;
    try {
      setIsProcessing(true);
      setShowVoiceModal(false);

      const result = await analyzeTextMeal(voiceText);
      setAnalysis(result);

      setIsProcessing(false);
      setVoiceText('');
      navigation.navigate('Review');
    } catch (err) {
      console.error('NLP Analysis failed:', err);
      Alert.alert('Hata', 'Öğün çözümlenemedi. Lütfen tekrar deneyin.');
      setIsProcessing(false);
    }
  };
  
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const setAnalyzing = useAnalysisStore(s => s.setAnalyzing);
  const addImageUri = useAnalysisStore(s => s.addImageUri);
  const removeImageUri = useAnalysisStore(s => s.removeImageUri);
  const imageUris = useAnalysisStore(s => s.imageUris);
  const resetAnalysis = useAnalysisStore(s => s.reset);
  const addToQueue = useOfflineQueueStore(s => s.addToQueue);

  // Clear analysis store when entering camera screen fresh
  useEffect(() => {
    resetAnalysis();
  }, [resetAnalysis]);

  const handleCapture = async () => {
    if (isBarcodeMode) return;
    if (!checkPremiumLimit()) return;
    try {
      setIsProcessing(true);

      const image = await cameraRef.current?.capture?.();
      if (!image?.uri) {
        throw new Error('Failed to capture image');
      }

      const savedUri = await saveImage(image.uri);
      addImageUri(savedUri);
      setIsProcessing(false);
    } catch (err) {
      console.error('Capture failed:', err);
      Alert.alert(tr.camera.errorTitle || 'Hata', tr.camera.captureError);
      setIsProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    if (!checkPremiumLimit()) return;
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]?.uri) {
        return;
      }

      setIsProcessing(true);
      const sourceUri = result.assets[0].uri;
      const savedUri = await saveImage(sourceUri);
      addImageUri(savedUri);
      setIsProcessing(false);
    } catch (err) {
      console.error('Gallery pick failed:', err);
      Alert.alert(
        tr.camera.errorTitle || 'Hata',
        tr.camera.galleryError || 'Galeriden fotoğraf seçilemedi.',
      );
      setIsProcessing(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (imageUris.length === 0) return;
    if (!checkPremiumLimit()) return;
    
    try {
      setAnalyzing(true);
      setIsProcessing(true);

      try {
        const result = await analyzeFoodImage(imageUris);
        setAnalysis(result);
      } catch (error) {
        console.warn('AI analysis failed, using mock data / offline queue:', error);
        
        // Add all captured images to offline queue
        for (const uri of imageUris) {
          addToQueue({
            imageUri: uri,
            mealCategory: 'breakfast',
          });
        }
        
        // Populate standard mock analysis
        const mockRes = getMockAnalysis(imageUris);
        setAnalysis(mockRes);
      }

      setAnalyzing(false);
      setIsProcessing(false);
      navigation.navigate('Review');
    } catch (err) {
      console.error('Analysis trigger failed:', err);
      Alert.alert('Hata', 'Analiz başlatılamadı.');
      setAnalyzing(false);
      setIsProcessing(false);
    }
  };

  const handleBarcodeRead = async (barcodeValue: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const foodMatch = findFoodByBarcode(barcodeValue);
      if (foodMatch) {
        // Automatically create a mock analysis results containing this food item!
        const result = {
          imageUris: ['barcode://scanned'],
          mealCategory: 'snack' as const,
          smartInsight: `Barkod taramasıyla '${foodMatch.name}' başarıyla eşleştirildi. Sağlıklı tüketimler!`,
          items: [
            {
              id: `barcode-${Date.now()}`,
              name: foodMatch.name,
              confidence: 1.0,
              estimatedPortionGrams: 100,
              caloriesPer100g: foodMatch.caloriesPer100g,
              proteinPer100g: foodMatch.proteinPer100g,
              carbsPer100g: foodMatch.carbsPer100g,
              fatPer100g: foodMatch.fatPer100g,
              fiberPer100g: foodMatch.fiberPer100g,
              sugarPer100g: foodMatch.sugarPer100g,
              sodiumPer100g: foodMatch.sodiumPer100g,
            },
          ],
        };
        setAnalysis(result);
        setIsProcessing(false);
        setIsBarcodeMode(false);
        navigation.navigate('Review');
      } else {
        setIsProcessing(false);
        Alert.alert(
          'Paket Bulunamadı',
          `'${barcodeValue}' barkodu yerel veritabanında bulunamadı. Lütfen besini elinizle ekleyin veya fotoğraf çekerek analiz edin.`,
          [{ text: 'Tamam' }]
        );
      }
    } catch (err) {
      console.error('Barcode read failed:', err);
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
          scanBarcode={isBarcodeMode}
          onReadCode={(event: {nativeEvent?: {codeStringValue?: string}}) => handleBarcodeRead(event.nativeEvent?.codeStringValue ?? '')}
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
          onPress={() => {
            resetAnalysis();
            navigation.navigate('MainTabs');
          }}
        >
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{tr.appName}</Text>
        </View>

        <View style={styles.topBarRight}>
          {/* Voice Assistant Button */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => setShowVoiceModal(true)}
            disabled={isBarcodeMode}
          >
            <Icon name="mic" size={24} color={isBarcodeMode ? colors.outline : colors.onSurface} />
          </TouchableOpacity>

          {/* Barcode Mode Toggle */}
          <TouchableOpacity
            style={[styles.iconButton, isBarcodeMode && styles.barcodeButtonActive]}
            activeOpacity={0.7}
            onPress={() => setIsBarcodeMode(v => !v)}
          >
            <Icon name={isBarcodeMode ? 'qr-code-scanner' : 'qr-code'} size={24} color={isBarcodeMode ? colors.primary : colors.onSurface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Center Reticle */}
      <View style={styles.reticleContainer}>
        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {isBarcodeMode ? 'Barkodu çerçeveye hizalayın' : tr.camera.alignFood}
          </Text>
        </View>

        <View style={[styles.reticle, isBarcodeMode && styles.reticleBarcode]}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {!isBarcodeMode && (
          <TouchableOpacity style={styles.manualEntryPill} onPress={handleManualAdd} activeOpacity={0.8}>
            <Icon name="search" size={16} color={colors.primary} />
            <Text style={styles.manualEntryPillText}>Manuel Arama ile Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>
            {isBarcodeMode ? 'Barkod aranıyor...' : tr.camera.processing}
          </Text>
        </View>
      )}

      {/* Bottom Controls Area */}
      <SafeAreaView style={styles.bottomControls}>
        {/* Horizontal Staging Bar (Yatay görsel staging barı) */}
        {imageUris.length > 0 && !isBarcodeMode && (
          <View style={styles.stagingWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stagingScroll}
            >
              {imageUris.map((uri, idx) => (
                <View key={idx} style={styles.stageItem}>
                  <Image source={{ uri }} style={styles.stageThumbnail} />
                  <TouchableOpacity
                    style={styles.stageDelete}
                    activeOpacity={0.7}
                    onPress={() => removeImageUri(uri)}
                  >
                    <Icon name="cancel" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.controlsRow}>
          {/* Gallery Import */}
          <TouchableOpacity
            style={styles.sideButton}
            activeOpacity={0.7}
            onPress={handleGalleryPick}
            disabled={isBarcodeMode}
          >
            <Icon name="photo-library" size={24} color={isBarcodeMode ? colors.outline : colors.onSurface} />
          </TouchableOpacity>

          {/* Capture / Run Button */}
          {imageUris.length > 0 && !isBarcodeMode ? (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleRunAnalysis}
              activeOpacity={0.8}
            >
              <Icon name="check" size={32} color={colors.onPrimary} />
              <View style={styles.analyzeBadge}>
                <Text style={styles.analyzeBadgeText}>{imageUris.length}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.captureButton, isBarcodeMode && styles.captureButtonDisabled]}
              onPress={handleCapture}
              activeOpacity={0.8}
              disabled={isBarcodeMode}
              testID="cameraCaptureButton"
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}

          {/* Flash Mode or Barcode Label */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFlashOn(v => !v)}
            activeOpacity={0.7}
            disabled={isBarcodeMode}
          >
            <Icon
              name={flashOn ? 'flash-on' : 'flash-off'}
              size={24}
              color={isBarcodeMode ? colors.outline : (flashOn ? colors.primary : colors.onSurface)}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Voice / Text Quick Log Modal */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="mic" size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Sesli / Metinle Hızlı Kayıt</Text>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Bugün ne yediğinizi yazın veya klavyenizdeki mikrofon tuşunu kullanarak konuşun:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Örn: Sabah 2 haşlanmış yumurta ve 1 dilim beyaz peynir yedim."
              placeholderTextColor={colors.outline}
              value={voiceText}
              onChangeText={setVoiceText}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <Text style={styles.modalHint}>
              💡 İpucu: Klavyedeki mikrofon simgesine basarak sesli de yazdırabilirsiniz!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowVoiceModal(false);
                  setVoiceText('');
                }}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !voiceText.trim() && styles.modalSaveDisabled]}
                onPress={handleVoiceAnalyze}
                disabled={!voiceText.trim()}
              >
                <Text style={styles.modalSaveText}>Çözümle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    height: 240,
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
  barcodeButtonActive: {
    backgroundColor: withAlpha(colors.primaryContainer, 0.8),
    borderWidth: 1,
    borderColor: colors.primary,
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
  reticleBarcode: {
    width: RETICLE_SIZE,
    height: 120,
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
    backgroundColor: withAlpha(colors.surface, 0.9),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
    marginBottom: spacing.md,
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
    paddingTop: spacing.sm,
  },
  stagingWrapper: {
    height: 72,
    marginBottom: spacing.md,
    backgroundColor: withAlpha(colors.surface, 0.5),
    borderRadius: radii.xl,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  stagingScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  stageItem: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    position: 'relative',
  },
  stageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
  },
  stageDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 15,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
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
  captureButtonDisabled: {
    backgroundColor: colors.outline,
    borderColor: 'transparent',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onSurface,
  },
  analyzeButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: withAlpha(colors.onSurface, 0.3),
    position: 'relative',
  },
  analyzeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.onSurface,
  },
  analyzeBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headlineSmall,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
    fontFamily: fontFamily.bodyMedium,
  },
  modalInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
    fontSize: 14,
    width: '100%',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xs,
    fontFamily: fontFamily.bodyMedium,
  },
  modalHint: {
    fontSize: 11,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontFamily.bodySmall,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
  },
  modalSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveDisabled: {
    backgroundColor: colors.surfaceContainer,
    opacity: 0.5,
  },
  modalSaveText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
  },
  titleContainer: {
    alignItems: 'center',
  },
  premiumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 94, 40, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 6,
    gap: 4,
  },
  premiumIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: fontFamily.headline,
    letterSpacing: 0.5,
  },
  freeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 6,
    gap: 6,
  },
  freeIndicatorIcon: {
    marginRight: -2,
  },
  freeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bodyMedium,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  manualEntryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(colors.surface, 0.7),
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  manualEntryPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: fontFamily.bodyMedium,
  },
});
