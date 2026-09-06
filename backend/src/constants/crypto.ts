/**
 * AES Cryptography Constants (Backend)
 * 
 * Centralized cryptographic constants, algorithms, key/IV/tag lengths, and error definitions.
 */

export const AES_ALGORITHM = 'aes-256-gcm';

export const AES_KEY_LENGTH_BYTES = 32; // 256 bits

export const AES_IV_LENGTH_BYTES = 12; // 96 bits (GCM standard)

export const AES_TAG_LENGTH_BYTES = 16; // 128 bits authentication tag

export const PBKDF2_ITERATIONS = 100000;

export const PBKDF2_DIGEST = 'sha256';

export const DEFAULT_ENCRYPTION_ENCODING: BufferEncoding = 'hex';

export const DEFAULT_DEV_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export const SERIALIZED_PAYLOAD_PREFIX = 'aes256gcm';

export const CRYPTO_ERRORS = {
  INVALID_KEY: 'Encryption key must be exactly 32 bytes (256 bits)',
  INVALID_IV: 'Initialization vector must be exactly 12 bytes',
  INVALID_TAG: 'Authentication tag must be exactly 16 bytes',
  DECRYPTION_FAILED: 'Decryption failed: ciphertext corrupted or authentication tag mismatch',
  INVALID_PAYLOAD: 'Invalid encrypted payload structure or unrecognized serialization format',
  MISSING_DATA: 'Plaintext data or ciphertext payload is required'
} as const;
