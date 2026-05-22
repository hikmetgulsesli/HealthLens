import RNFS from 'react-native-fs';

const APP_DIR = `${RNFS.DocumentDirectoryPath}/HealthLens`;
const IMAGES_DIR = `${APP_DIR}/images`;

export async function ensureDirectories(): Promise<void> {
  const exists = await RNFS.exists(APP_DIR);
  if (!exists) {
    await RNFS.mkdir(APP_DIR);
  }
  const imagesExists = await RNFS.exists(IMAGES_DIR);
  if (!imagesExists) {
    await RNFS.mkdir(IMAGES_DIR);
  }
}

export async function saveImage(sourceUri: string): Promise<string> {
  await ensureDirectories();

  const filename = `food_${Date.now()}.jpg`;
  const destPath = `${IMAGES_DIR}/${filename}`;

  await RNFS.copyFile(sourceUri, destPath);

  return `file://${destPath}`;
}

export async function deleteImage(imageUri: string): Promise<void> {
  if (imageUri.startsWith('file://')) {
    const path = imageUri.replace('file://', '');
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  }
}

export async function imageToBase64(uri: string): Promise<string> {
  if (uri.startsWith('file://') || uri.startsWith('/')) {
    return await RNFS.readFile(uri, 'base64');
  }
  throw new Error('Unsupported image URI format');
}
