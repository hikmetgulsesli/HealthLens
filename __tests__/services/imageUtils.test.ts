import RNFS from 'react-native-fs';
import {
  validateImageSize,
  mimeFromUri,
  compressImage,
} from '../../src/services/imageUtils';
import {
  saveImage,
  deleteImage,
  imageToBase64,
  ensureDirectories,
} from '../../src/utils/imageStorage';

describe('imageUtils', () => {
  describe('validateImageSize', () => {
    it('passes for buffer under 20MB', () => {
      const buf = new ArrayBuffer(1024);
      expect(() => validateImageSize(buf)).not.toThrow();
    });

    it('throws for buffer over 20MB', () => {
      const buf = new ArrayBuffer(21 * 1024 * 1024);
      expect(() => validateImageSize(buf)).toThrow(/20 MB/);
    });

    it('accepts custom max', () => {
      const buf = new ArrayBuffer(2 * 1024);
      expect(() => validateImageSize(buf, 1024)).toThrow();
    });

    it('throws at exactly max+1 bytes', () => {
      const buf = new ArrayBuffer(20 * 1024 * 1024 + 1);
      expect(() => validateImageSize(buf)).toThrow();
    });

    it('accepts buffer at exactly max bytes', () => {
      const buf = new ArrayBuffer(20 * 1024 * 1024);
      expect(() => validateImageSize(buf)).not.toThrow();
    });

    it('throws with informative message containing the actual MB size', () => {
      const buf = new ArrayBuffer(25 * 1024 * 1024);
      expect(() => validateImageSize(buf)).toThrow(/25\.0 MB/);
    });
  });

  describe('mimeFromUri', () => {
    it('infers JPEG from .jpg/.jpeg', () => {
      expect(mimeFromUri('file:///foo/bar.jpg')).toBe('image/jpeg');
      expect(mimeFromUri('file:///foo/bar.jpeg')).toBe('image/jpeg');
    });

    it('infers PNG from .png', () => {
      expect(mimeFromUri('file:///foo/bar.png')).toBe('image/png');
    });

    it('infers HEIC from .heic', () => {
      expect(mimeFromUri('file:///foo/bar.heic')).toBe('image/heic');
    });

    it('infers HEIF from .heif', () => {
      expect(mimeFromUri('file:///foo/bar.heif')).toBe('image/heic');
    });

    it('is case-insensitive on the extension', () => {
      expect(mimeFromUri('file:///foo/bar.JPG')).toBe('image/jpeg');
      expect(mimeFromUri('file:///foo/bar.PNG')).toBe('image/png');
      expect(mimeFromUri('file:///foo/bar.HEIC')).toBe('image/heic');
    });

    it('defaults to JPEG for unknown extension', () => {
      expect(mimeFromUri('file:///foo/bar')).toBe('image/jpeg');
      expect(mimeFromUri('file:///foo/bar.gif')).toBe('image/jpeg');
      expect(mimeFromUri('file:///foo/bar.webp')).toBe('image/jpeg');
    });
  });

  describe('compressImage', () => {
    it('strips file:// prefix and reads via RNFS', async () => {
      // base64 for "hello" → decoded bytes
      (RNFS.readFile as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
      const buf = await compressImage('file:///path/to/img.jpg');
      expect(RNFS.readFile).toHaveBeenCalledWith('/path/to/img.jpg', 'base64');
      expect(new Uint8Array(buf)).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
    });

    it('keeps plain paths (no file://) untouched', async () => {
      (RNFS.readFile as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
      await compressImage('/abs/path/img.png');
      expect(RNFS.readFile).toHaveBeenCalledWith('/abs/path/img.png', 'base64');
    });
  });
});

describe('imageStorage', () => {
  beforeEach(() => {
    (RNFS.exists as jest.Mock).mockReset();
    (RNFS.mkdir as jest.Mock).mockReset();
    (RNFS.copyFile as jest.Mock).mockReset();
    (RNFS.unlink as jest.Mock).mockReset();
    (RNFS.readFile as jest.Mock).mockReset();
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
  });

  it('ensureDirectories creates both app dir and images dir when missing', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(false);
    await ensureDirectories();
    expect(RNFS.mkdir).toHaveBeenCalledTimes(2);
  });

  it('ensureDirectories skips mkdir when both dirs exist', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    await ensureDirectories();
    expect(RNFS.mkdir).not.toHaveBeenCalled();
  });

  it('saveImage copies the source URI into the images dir and returns file:// URL', async () => {
    const result = await saveImage('file:///tmp/incoming.jpg');
    expect(RNFS.copyFile).toHaveBeenCalledTimes(1);
    const [src, dest] = (RNFS.copyFile as jest.Mock).mock.calls[0];
    expect(src).toBe('/tmp/incoming.jpg');
    expect(dest).toMatch(/\/HealthLens\/images\/food_\d+\.jpg$/);
    expect(result).toMatch(/^file:\/\/\/mock\/documents\/HealthLens\/images\/food_\d+\.jpg$/);
  });

  it('saveImage strips file:// from source before copying', async () => {
    await saveImage('file:///tmp/photo.jpg');
    expect((RNFS.copyFile as jest.Mock).mock.calls[0][0]).toBe('/tmp/photo.jpg');
  });

  it('saveImage saves a .png file with .png extension when source is .png', async () => {
    await saveImage('file:///tmp/photo.png');
    expect((RNFS.copyFile as jest.Mock).mock.calls[0][1]).toMatch(/\.png$/);
  });

  it('saveImage falls back to .jpg when source has no extension', async () => {
    await saveImage('file:///tmp/blob');
    expect((RNFS.copyFile as jest.Mock).mock.calls[0][1]).toMatch(/\.jpg$/);
  });

  it('deleteImage removes only file:// prefixed paths that exist', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValueOnce(true);
    await deleteImage('file:///mock/documents/x.jpg');
    expect(RNFS.unlink).toHaveBeenCalledWith('/mock/documents/x.jpg');
  });

  it('deleteImage skips unlink when file does not exist', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValueOnce(false);
    await deleteImage('file:///missing.jpg');
    expect(RNFS.unlink).not.toHaveBeenCalled();
  });

  it('deleteImage ignores non-file:// URIs (no filesystem path to unlink)', async () => {
    await deleteImage('content://media/123');
    expect(RNFS.unlink).not.toHaveBeenCalled();
  });

  it('imageToBase64 reads file paths and returns the base64 string', async () => {
    (RNFS.readFile as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
    const result = await imageToBase64('file:///x.jpg');
    expect(RNFS.readFile).toHaveBeenCalledWith('/x.jpg', 'base64');
    expect(result).toBe('aGVsbG8=');
  });

  it('imageToBase64 reads raw absolute paths the same way', async () => {
    (RNFS.readFile as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
    await imageToBase64('/abs/path/x.jpg');
    expect(RNFS.readFile).toHaveBeenCalledWith('/abs/path/x.jpg', 'base64');
  });
});

