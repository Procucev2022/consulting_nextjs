/**
 * AES-256-GCM Cryptographic Utility (Backend)
 * 
 * Provides high-performance Authenticated Encryption with Associated Data (AEAD)
 * to guarantee confidentiality, authenticity, and integrity across sensitive data.
 */

import crypto from 'crypto';
import {
  AES_ALGORITHM,
  AES_KEY_LENGTH_BYTES,
  AES_IV_LENGTH_BYTES,
  AES_TAG_LENGTH_BYTES,
  PBKDF2_ITERATIONS,
  PBKDF2_DIGEST,
  DEFAULT_ENCRYPTION_ENCODING,
  DEFAULT_DEV_ENCRYPTION_KEY,
  SERIALIZED_PAYLOAD_PREFIX,
  CRYPTO_ERRORS
} from '../constants/crypto';
import type {
  EncryptedDataPayload,
  EncryptionOptions,
  DecryptionOptions
} from '../types/crypto';
import logger from './logger';

/**
 * Retrieves the effective 32-byte encryption key from environment or default fallback.
 */
export function resolveEncryptionKey(providedKey?: string | Buffer): Buffer {
  if (providedKey) {
    if (Buffer.isBuffer(providedKey)) {
      if (providedKey.length !== AES_KEY_LENGTH_BYTES) {
        throw new Error(CRYPTO_ERRORS.INVALID_KEY);
      }
      return providedKey;
    }

    const trimmed = providedKey.trim();
    const encoding: BufferEncoding = (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) ? 'hex' : 'utf8';
    const buf = Buffer.from(trimmed, encoding);
    if (buf.length !== AES_KEY_LENGTH_BYTES) {
      throw new Error(CRYPTO_ERRORS.INVALID_KEY);
    }
    return buf;
  }

  const envKey = process.env.APP_ENCRYPTION_KEY || DEFAULT_DEV_ENCRYPTION_KEY;
  const keyBuf = Buffer.from(envKey, 'hex');
  if (keyBuf.length !== AES_KEY_LENGTH_BYTES) {
    throw new Error(CRYPTO_ERRORS.INVALID_KEY);
  }
  return keyBuf;
}

/**
 * Derives a 256-bit encryption key from a passphrase and salt using PBKDF2.
 */
export function deriveKeyFromPassphrase(passphrase: string, salt: string): Buffer {
  if (!passphrase || !salt) {
    throw new Error('Passphrase and salt are required for key derivation');
  }
  return crypto.pbkdf2Sync(
    passphrase,
    salt,
    PBKDF2_ITERATIONS,
    AES_KEY_LENGTH_BYTES,
    PBKDF2_DIGEST
  );
}

/**
 * Generates a cryptographically secure 256-bit random key in hexadecimal.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(AES_KEY_LENGTH_BYTES).toString('hex');
}

/**
 * Encrypts plaintext data using AES-256-GCM authenticated encryption.
 */
export function encryptData(
  plaintext: string | Buffer | object,
  key?: string | Buffer,
  options?: EncryptionOptions
): EncryptedDataPayload {
  const start = Date.now();
  try {
    let resolvedKey: Buffer;
    let saltHex: string | undefined;

    if (options?.salt) {
      saltHex = options.salt;
      const basePassphrase = typeof key === 'string' ? key : key?.toString('utf8') || process.env.APP_ENCRYPTION_KEY || DEFAULT_DEV_ENCRYPTION_KEY;
      resolvedKey = deriveKeyFromPassphrase(basePassphrase, saltHex);
    } else {
      resolvedKey = resolveEncryptionKey(key);
    }

    const encoding = options?.encoding || DEFAULT_ENCRYPTION_ENCODING;
    const iv = crypto.randomBytes(AES_IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv(AES_ALGORITHM, resolvedKey, iv);

    if (options?.associatedData) {
      cipher.setAAD(Buffer.from(options.associatedData, 'utf8'));
    }

    const inputBuffer = Buffer.isBuffer(plaintext)
      ? plaintext
      : Buffer.from(typeof plaintext === 'object' ? JSON.stringify(plaintext) : String(plaintext), 'utf8');

    const ciphertext = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    const durationMs = Date.now() - start;
    logger.debug('AES-256-GCM encryption completed', {
      algorithm: AES_ALGORITHM,
      ciphertextLength: ciphertext.length,
      durationMs
    });

    return {
      algorithm: AES_ALGORITHM,
      iv: iv.toString(encoding),
      tag: tag.toString(encoding),
      ciphertext: ciphertext.toString(encoding),
      salt: saltHex
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('AES encryption error', { error: message });
    throw err;
  }
}

function validateAndExtractBuffers(
  payload: EncryptedDataPayload,
  encoding: BufferEncoding
): { iv: Buffer; tag: Buffer; ciphertext: Buffer } {
  if (!payload.iv || !payload.tag || !payload.ciphertext) {
    throw new Error(CRYPTO_ERRORS.INVALID_PAYLOAD);
  }

  const iv = Buffer.from(payload.iv, encoding);
  const tag = Buffer.from(payload.tag, encoding);
  const ciphertext = Buffer.from(payload.ciphertext, encoding);

  if (iv.length !== AES_IV_LENGTH_BYTES) {
    throw new Error(CRYPTO_ERRORS.INVALID_IV);
  }
  if (tag.length !== AES_TAG_LENGTH_BYTES) {
    throw new Error(CRYPTO_ERRORS.INVALID_TAG);
  }

  return { iv, tag, ciphertext };
}

function resolveDecryptionKey(key: string | Buffer | undefined, salt?: string): Buffer {
  if (salt) {
    const basePassphrase = typeof key === 'string'
      ? key
      : key?.toString('utf8') || process.env.APP_ENCRYPTION_KEY || DEFAULT_DEV_ENCRYPTION_KEY;
    return deriveKeyFromPassphrase(basePassphrase, salt);
  }
  return resolveEncryptionKey(key);
}

function handleDecryptionError(err: unknown): never {
  const errMsg = err instanceof Error ? err.message : String(err);
  logger.warn('AES decryption verification failed', { error: errMsg });

  const knownErrors = Object.values(CRYPTO_ERRORS) as string[];
  if (knownErrors.includes(errMsg)) {
    throw err;
  }
  if (errMsg.includes('auth') || errMsg.includes('tag') || errMsg.includes('Unsupported state')) {
    throw new Error(CRYPTO_ERRORS.DECRYPTION_FAILED);
  }
  throw err;
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies the authentication tag.
 */
export function decryptData(
  encrypted: EncryptedDataPayload | string,
  key?: string | Buffer,
  options?: DecryptionOptions
): string {
  const start = Date.now();
  try {
    const payload: EncryptedDataPayload = typeof encrypted === 'string'
      ? deserializeEncryptedPayload(encrypted)
      : encrypted;

    const encoding = options?.encoding || DEFAULT_ENCRYPTION_ENCODING;
    const { iv, tag, ciphertext } = validateAndExtractBuffers(payload, encoding);
    const resolvedKey = resolveDecryptionKey(key, payload.salt);

    const decipher = crypto.createDecipheriv(AES_ALGORITHM, resolvedKey, iv);
    decipher.setAuthTag(tag);

    if (options?.associatedData) {
      decipher.setAAD(Buffer.from(options.associatedData, 'utf8'));
    }

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const durationMs = Date.now() - start;

    logger.debug('AES-256-GCM decryption completed', {
      algorithm: AES_ALGORITHM,
      durationMs
    });

    return decrypted.toString('utf8');
  } catch (err: unknown) {
    handleDecryptionError(err);
  }
}

/**
 * Serializes an EncryptedDataPayload into a compact portable format.
 * Format: aes256gcm:<iv>:<tag>:<ciphertext> or aes256gcm:<iv>:<tag>:<ciphertext>:<salt>
 */
export function serializeEncryptedPayload(payload: EncryptedDataPayload): string {
  const parts = [SERIALIZED_PAYLOAD_PREFIX, payload.iv, payload.tag, payload.ciphertext];
  if (payload.salt) {
    parts.push(payload.salt);
  }
  return parts.join(':');
}

/**
 * Deserializes a compact string payload back into an EncryptedDataPayload structure.
 */
export function deserializeEncryptedPayload(serialized: string): EncryptedDataPayload {
  if (!serialized || typeof serialized !== 'string') {
    throw new Error(CRYPTO_ERRORS.INVALID_PAYLOAD);
  }

  if (serialized.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(serialized);
      if (parsed.iv && parsed.tag && parsed.ciphertext) {
        return parsed as EncryptedDataPayload;
      }
    } catch {
      // Fall through to delimiter parsing
    }
  }

  const parts = serialized.split(':');
  if (parts.length < 4 || parts[0] !== SERIALIZED_PAYLOAD_PREFIX) {
    throw new Error(CRYPTO_ERRORS.INVALID_PAYLOAD);
  }

  return {
    algorithm: AES_ALGORITHM,
    iv: parts[1],
    tag: parts[2],
    ciphertext: parts[3],
    salt: parts[4] || undefined
  };
}

/**
 * Encrypts an arbitrary object or primitive into a compact serialized string.
 */
export function encryptField<T = unknown>(value: T, key?: string | Buffer): string {
  const payload = encryptData(typeof value === 'string' ? value : JSON.stringify(value), key);
  return serializeEncryptedPayload(payload);
}

/**
 * Decrypts a compact serialized string into the original typed object or primitive.
 */
export function decryptField<T = unknown>(serialized: string, key?: string | Buffer): T {
  const decrypted = decryptData(serialized, key);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}
