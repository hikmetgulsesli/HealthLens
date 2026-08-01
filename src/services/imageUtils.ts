import RNFS from 'react-native-fs';

const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export function validateImageSize(
  buffer: ArrayBuffer,
  maxBytes: number = DEFAULT_MAX_BYTES,
): void {
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `Görsel boyutu çok büyük. Lütfen daha küçük bir fotoğraf seçin. (${(
        buffer.byteLength /
        1024 /
        1024
      ).toFixed(1)} MB > ${maxBytes / 1024 / 1024} MB)`,
    );
  }
}

export function mimeFromUri(
  uri: string,
): 'image/jpeg' | 'image/png' | 'image/heic' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

export async function compressImage(
  uri: string,
  _maxEdge: number = 1024,
): Promise<ArrayBuffer> {
  const cleanUri = uri.replace('file://', '');
  const base64 = await RNFS.readFile(cleanUri, 'base64');
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return buffer.buffer;
}
