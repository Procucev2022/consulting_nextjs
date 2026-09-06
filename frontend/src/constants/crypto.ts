/**
 * AES Cryptography Constants (Frontend)
 * 
 * Centralized cryptographic parameters for Web Crypto API AES-GCM operations.
 */

export const CLIENT_AES_ALGORITHM = 'AES-GCM';

export const CLIENT_AES_KEY_LENGTH_BITS = 256;

export const CLIENT_AES_IV_LENGTH_BYTES = 12; // 96 bits

export const CLIENT_AES_TAG_LENGTH_BITS = 128; // 16 bytes

export const DEFAULT_CLIENT_CRYPTO_PREFIX = 'aes256gcm';

export const CLIENT_CRYPTO_ERRORS = {
  UNSUPPORTED_ENVIRONMENT: 'Web Crypto API is not available in current execution context',
  INVALID_PAYLOAD: 'Encrypted payload structure is corrupted or invalid',
  DECRYPTION_FAILED: 'Client decryption failed: authentication tag verification error or key mismatch'
} as const;
