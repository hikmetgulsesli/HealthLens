/* eslint-disable no-bitwise */
import CryptoJS from 'crypto-js';

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  return CryptoJS.SHA256(bytesToWordArray(bytes)).toString(CryptoJS.enc.Hex);
}
