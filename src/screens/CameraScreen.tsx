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
import {colors, radii} from '../theme/colors';
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
      // TODO: use real capture when camera-kit API is stable
      // const image = await cameraRef.current?.capture?.();
      // Mock analysis
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
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        cameraType={CameraType.Back}
        flashMode={flashOn ? 'on' : 'off'}
        testID="cameraPreview"
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HealthLens</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>⚙</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.focusReticle}>
          <View style={styles.reticleCorner} />
          <View style={[styles.reticleCorner, styles.reticleCornerTR]} />
          <View style={[styles.reticleCorner, styles.reticleCornerBL]} />
          <View style={[styles.reticleCorner, styles.reticleCornerBR]} />
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => { /* gallery */ }}>
            <Image
              source={{uri: 'https://via.placeholder.com/40'}}
              style={styles.galleryThumb}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            testID="cameraCaptureButton"
          />
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFlashOn(v => !v)}>
            <Text style={[styles.iconText, flashOn && styles.flashActive]}>
              ⚡
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  overlay: {flex: 1, justifyContent: 'space-between'},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {color: colors.onSurface, fontSize: 16, fontWeight: '600'},
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {color: colors.onSurface, fontSize: 18},
  flashActive: {color: colors.primary},
  focusReticle: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    justifyContent: 'space-between',
  },
  reticleCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255,255,255,0.5)',
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  reticleCornerTR: {right: 0, borderLeftWidth: 0, borderRightWidth: 2},
  reticleCornerBL: {bottom: 0, borderTopWidth: 0, borderBottomWidth: 2},
  reticleCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.onSurface,
    backgroundColor: colors.primaryContainer,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryThumb: {width: 40, height: 40, borderRadius: 8},
});
