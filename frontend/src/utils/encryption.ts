/**
 * Client-Side AES-GCM Cryptographic Utility (Frontend)
 * 
 * Provides Web Crypto API based authenticated AES-GCM encryption and decryption
 * for end-to-end data security and sensitive client-side payload protection.
 */

import {
  CLIENT_AES_ALGORITHM,
  CLIENT_AES_KEY_LENGTH_BITS,
  CLIENT_AES_IV_LENGTH_BYTES,
  CLIENT_AES_TAG_LENGTH_BITS,
  DEFAULT_CLIENT_CRYPTO_PREFIX,
  CLIENT_CRYPTO_ERRORS
} from '../constants/crypto';
import type {
  ClientEncryptedPayload,
  ClientEncryptionOptions
} from '../types/crypto';
import frontendLogger from './logger';

const DEFAULT_DEV_CLIENT_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getSubtleCrypto(): SubtleCrypto {
  const cryptoObj = typeof window !== 'undefined'
    ? window.crypto
    : (globalThis as unknown as { crypto?: Crypto }).crypto;

  if (!cryptoObj?.subtle) {
    throw new Error(CLIENT_CRYPTO_ERRORS.UNSUPPORTED_ENVIRONMENT);
  }
  return cryptoObj.subtle;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Generates a new 256-bit AES-GCM CryptoKey.
 */
export async function generateClientKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  return await subtle.generateKey(
    {
      name: CLIENT_AES_ALGORITHM,
      length: CLIENT_AES_KEY_LENGTH_BITS
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Imports a raw 32-byte hexadecimal string as an AES-GCM CryptoKey.
 */
export async function importHexKey(hexKey: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const keyBytes = hexToBytes(hexKey);
  return await subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: CLIENT_AES_ALGORITHM },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports an AES-GCM CryptoKey to a hexadecimal string.
 */
export async function exportKeyToHex(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const raw = await subtle.exportKey('raw', key);
  return bytesToHex(new Uint8Array(raw));
}

/**
 * Encrypts plaintext using AES-GCM with a fresh 12-byte initialization vector.
 */
export async function encryptDataClient(
  plaintext: string,
  key?: CryptoKey | string,
  options?: ClientEncryptionOptions
): Promise<ClientEncryptedPayload> {
  const subtle = getSubtleCrypto();
  const start = Date.now();

  try {
    const cryptoKey: CryptoKey = typeof key === 'string'
      ? await importHexKey(key)
      : key || await importHexKey(DEFAULT_DEV_CLIENT_KEY);

    const cryptoInstance = typeof window !== 'undefined'
      ? window.crypto
      : (globalThis as unknown as { crypto: Crypto }).crypto;

    const iv = cryptoInstance.getRandomValues(
      new Uint8Array(CLIENT_AES_IV_LENGTH_BYTES)
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    const algorithm: AesGcmParams = {
      name: CLIENT_AES_ALGORITHM,
      iv,
      tagLength: CLIENT_AES_TAG_LENGTH_BITS,
      additionalData: options?.associatedData ? encoder.encode(options.associatedData) : undefined
    };

    const ciphertextWithTagBuffer = await subtle.encrypt(algorithm, cryptoKey, encodedData);
    const combinedBytes = new Uint8Array(ciphertextWithTagBuffer);

    // Split ciphertext and 16-byte tag (Web Crypto appends auth tag to end of ciphertext)
    const tagByteLength = CLIENT_AES_TAG_LENGTH_BITS / 8;
    const ciphertextBytes = combinedBytes.slice(0, combinedBytes.length - tagByteLength);
    const tagBytes = combinedBytes.slice(combinedBytes.length - tagByteLength);

    const durationMs = Date.now() - start;
    frontendLogger.debug('Client-side AES-GCM encryption succeeded', { durationMs });

    return {
      algorithm: CLIENT_AES_ALGORITHM,
      iv: bytesToHex(iv),
      tag: bytesToHex(tagBytes),
      ciphertext: bytesToHex(ciphertextBytes)
    };
  } catch (err: unknown) {
    frontendLogger.error('Client encryption failed', {}, err);
    throw err;
  }
}

/**
 * Decrypts an AES-GCM payload and verifies the authentication tag.
 */
export async function decryptDataClient(
  encrypted: ClientEncryptedPayload | string,
  key?: CryptoKey | string,
  options?: ClientEncryptionOptions
): Promise<string> {
  const subtle = getSubtleCrypto();
  const start = Date.now();

  try {
    const payload: ClientEncryptedPayload = typeof encrypted === 'string'
      ? deserializeClientPayload(encrypted)
      : encrypted;

    if (!payload.iv || !payload.tag || !payload.ciphertext) {
      throw new Error(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
    }

    const cryptoKey: CryptoKey = typeof key === 'string'
      ? await importHexKey(key)
      : key || await importHexKey(DEFAULT_DEV_CLIENT_KEY);

    const ivBytes = hexToBytes(payload.iv);
    const ciphertextBytes = hexToBytes(payload.ciphertext);
    const tagBytes = hexToBytes(payload.tag);

    // Reconstruct the Web Crypto combined buffer [ciphertext, tag]
    const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    combined.set(ciphertextBytes, 0);
    combined.set(tagBytes, ciphertextBytes.length);

    const additionalData = options?.associatedData
      ? (new TextEncoder().encode(options.associatedData) as unknown as BufferSource)
      : undefined;

    const algorithm: AesGcmParams = {
      name: CLIENT_AES_ALGORITHM,
      iv: ivBytes as unknown as BufferSource,
      tagLength: CLIENT_AES_TAG_LENGTH_BITS,
      additionalData
    };

    const decryptedBuffer = await subtle.decrypt(algorithm, cryptoKey, combined as unknown as BufferSource);
    const plaintext = new TextDecoder().decode(decryptedBuffer);

    const durationMs = Date.now() - start;
    frontendLogger.debug('Client-side AES-GCM decryption succeeded', { durationMs });

    return plaintext;
  } catch (err: unknown) {
    const errorObj = err as { message: string };
    frontendLogger.warn('Client decryption verification failed', { error: errorObj.message });
    if ((Object.values(CLIENT_CRYPTO_ERRORS) as string[]).includes(errorObj.message)) {
      throw err;
    }
    throw new Error(CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED);
  }
}

/**
 * Serializes ClientEncryptedPayload into a compact portable string format.
 */
export function serializeClientPayload(payload: ClientEncryptedPayload): string {
  return `${DEFAULT_CLIENT_CRYPTO_PREFIX}:${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}

/**
 * Deserializes a compact portable string into a ClientEncryptedPayload.
 */
export function deserializeClientPayload(serialized: string): ClientEncryptedPayload {
  if (!serialized || typeof serialized !== 'string') {
    throw new Error(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
  }

  const parts = serialized.split(':');
  if (parts.length < 4 || parts[0] !== DEFAULT_CLIENT_CRYPTO_PREFIX) {
    throw new Error(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
  }

  return {
    algorithm: CLIENT_AES_ALGORITHM,
    iv: parts[1],
    tag: parts[2],
    ciphertext: parts[3]
  };
}
