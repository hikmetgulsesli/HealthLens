import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export function createMmkvStorage(instanceId: string): StateStorage {
  const storage = new MMKV({ id: instanceId });
  return {
    getItem: (name: string) => {
      try {
        const value = storage.getString(name);
        return value ?? null;
      } catch (err) {
        console.warn(`[persist] getItem failed for ${name}:`, err);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        storage.set(name, value);
      } catch (err) {
        console.warn(`[persist] setItem failed for ${name}:`, err);
      }
    },
    removeItem: (name: string) => {
      try {
        storage.delete(name);
      } catch (err) {
        console.warn(`[persist] removeItem failed for ${name}:`, err);
      }
    },
  };
}
