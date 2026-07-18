import { createMmkvStorage } from '../../src/lib/persist';

describe('createMmkvStorage', () => {
  it('returns a StateStorage with getItem/setItem/removeItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('persists a value via setItem and reads it back via getItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('returns null from getItem when key is missing', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    expect(storage.getItem('missing')).toBeNull();
  });

  it('removes a key via removeItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    storage.setItem('k', 'v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });
});
