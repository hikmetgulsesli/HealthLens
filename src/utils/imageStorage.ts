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

function stripFileScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}

function inferExtension(uri: string): string {
  const lower = stripFileScheme(uri).toLowerCase();
  const slash = lower.lastIndexOf('/');
  const basename = slash >= 0 ? lower.slice(slash + 1) : lower;
  const dot = basename.lastIndexOf('.');
  if (dot <= 0) return '.jpg';
  const ext = basename.slice(dot);
  if (ext === '.png' || ext === '.heic' || ext === '.heif') return ext;
  return '.jpg';
}

export async function saveImage(sourceUri: string): Promise<string> {
  await ensureDirectories();

  const filename = `food_${Date.now()}${inferExtension(sourceUri)}`;
  const destPath = `${IMAGES_DIR}/${filename}`;

  await RNFS.copyFile(stripFileScheme(sourceUri), destPath);

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
    return await RNFS.readFile(stripFileScheme(uri), 'base64');
  }
  throw new Error('Unsupported image URI format');
}
