/**
 * AES Cryptography Constants (Frontend)
 * 
 * Centralized cryptographic parameters for Web Crypto API AES-GCM operations.
 */

export const CLIENT_AES_ALGORITHM = 'AES-GCM';

export const CLIENT_AES_KEY_LENGTH_BITS = 256;

export const CLIENT_AES_KEY_LENGTH_BYTES = CLIENT_AES_KEY_LENGTH_BITS / 8;

export const CLIENT_AES_KEY_HEX_LENGTH = CLIENT_AES_KEY_LENGTH_BYTES * 2;

export const CLIENT_AES_IV_LENGTH_BYTES = 12; // 96 bits

export const CLIENT_AES_IV_HEX_LENGTH = CLIENT_AES_IV_LENGTH_BYTES * 2;

export const CLIENT_AES_TAG_LENGTH_BITS = 128; // 16 bytes

export const CLIENT_AES_TAG_LENGTH_BYTES = CLIENT_AES_TAG_LENGTH_BITS / 8;

export const CLIENT_AES_TAG_HEX_LENGTH = CLIENT_AES_TAG_LENGTH_BYTES * 2;

export const CLIENT_AES_HEX_PATTERN = /^[0-9a-f]+$/iu;

export const CLIENT_AES_OPTIONAL_HEX_PATTERN = /^[0-9a-f]*$/iu;

export const DEFAULT_CLIENT_CRYPTO_PREFIX = 'aes256gcm';

export const CLIENT_CRYPTO_ERRORS = {
  UNSUPPORTED_ENVIRONMENT: 'Web Crypto API is not available in current execution context',
  MISSING_KEY: 'A caller-managed 256-bit AES-GCM key is required for client encryption and decryption',
  INVALID_KEY: 'Client encryption key must be a valid 256-bit AES-GCM key with the required usage',
  INVALID_PAYLOAD: 'Encrypted payload structure is corrupted or invalid',
  DECRYPTION_FAILED: 'Client decryption failed: authentication tag verification error or key mismatch'
} as const;
