import { validateImageSize, mimeFromUri } from '../../src/services/imageUtils';

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

    it('defaults to JPEG for unknown', () => {
      expect(mimeFromUri('file:///foo/bar')).toBe('image/jpeg');
    });
  });
});
